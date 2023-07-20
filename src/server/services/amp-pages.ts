import { Request } from "express";
import { createClient } from "redis";
import { AppState } from "../../common/store";
import { renderAmp } from "../amp-template";
// @ts-ignore
import { htmlToAMP } from "@ecency/render-helper-amp";
import * as fs from "fs";
import config from "../../config";
import { Redis } from "./redis";

let assets: any = require(process.env.RAZZLE_ASSETS_MANIFEST || "");

export async function getAsAMP(
  identifier: string,
  request: Request,
  preloadedState: AppState,
  forceRender = false
): Promise<string> {
  const client = createClient({
    url: config.redisUrl
  });
  const redis = new Redis(client);

  try {
    const cache = await redis.get(identifier);
    if (cache && !forceRender) {
      return cache;
    }
  } catch (e) {
    console.error(e);
    console.error("Redis is unavailable. AMP caches ignoring");
  }

  const renderResult = await renderAmp(request, preloadedState);

  let ampResult = await htmlToAMP(renderResult, false, true, false);
  ampResult = ampResult.replace(/\n/gm, "");

  if (assets["pages-amp-entry-amp-page"].css) {
    const styleBlockIndex = ampResult.search("</style>") + 8;
    const pageStyles = fs
      .readFileSync(`build/public${assets["pages-amp-entry-amp-page"].css[0]}`)
      .toString();

    ampResult = [
      ampResult.slice(0, styleBlockIndex),
      `<style amp-custom>${pageStyles}</style>`,
      ampResult.slice(styleBlockIndex)
    ].join("");
  }

  const modifiedClasses = "theme-day";
  ampResult = ampResult.replace("<body>", `<body class="${modifiedClasses}">`);

  try {
    await redis.set(identifier, ampResult);
  } catch (e) {
    console.error(e);
    console.error("Redis is unavailable. AMP caches ignoring");
  }
  return ampResult;
}
