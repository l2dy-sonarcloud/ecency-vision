import React, { useEffect, useState } from "react";
import { Form, FormControl, InputGroup } from "react-bootstrap";
import axios from "axios";

import { Channel } from "../../../providers/message-provider-types";
import { Chat } from "../../store/chat/types";
import { ActiveUser } from "../../store/active-user/types";
import { Global } from "../../store/global/types";

import ClickAwayListener from "../clickaway-listener";
import EmojiPicker from "../emoji-picker";
import GifPicker from "../gif-picker";
import { error } from "../feedback";
import Tooltip from "../tooltip";

import { emoticonHappyOutlineSvg, gifIcon, chatBoxImageSvg, messageSendSvg } from "../../img/svg";
import { GifImagesStyle, UPLOADING } from "../chat-box/chat-constants";

import { _t } from "../../i18n";
import { getAccessToken } from "../../helper/user-token";
import { uploadImage } from "../../api/misc";
import { addImage } from "../../api/private-api";

import "./index.scss";
import { EmojiPickerStyleProps } from "../chat-box";

interface Props {
  activeUser: ActiveUser | null;
  global: Global;
  chat: Chat;
  isCurrentUser: boolean;
  isCommunity: boolean;
  receiverPubKey: string | null;
  isActveUserRemoved: boolean;
  currentChannel: Channel;
  currentUser: string;
  isCurrentUserJoined: boolean;
  emojiPickerStyles: EmojiPickerStyleProps;
  gifPickerStyle: EmojiPickerStyleProps;
}

export default function ChatInput(props: Props) {
  const fileInput = React.createRef<HTMLInputElement>();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [message, setMessage] = useState("");
  const [shGif, setShGif] = useState(false);
  const [isMessageText, setIsMessageText] = useState(false);

  const {
    isCommunity,
    isCurrentUser,
    isActveUserRemoved,
    receiverPubKey,
    currentChannel,
    currentUser,
    isCurrentUserJoined,
    emojiPickerStyles,
    gifPickerStyle
  } = props;
  // console.log("currentUser in chat input", currentUser);

  useEffect(() => {
    if (!isCurrentUser && !isCommunity) {
      setMessage("");
    }
  }, [isCommunity, isCurrentUser]);

  const handleEmojiSelection = (emoji: string) => {
    setMessage((prevMessage) => prevMessage + emoji);
  };

  const toggleGif = (e?: React.MouseEvent<HTMLElement>) => {
    if (e) {
      e.stopPropagation();
    }
    setShGif(!shGif);
  };

  const handleGifSelection = (gif: string) => {
    isCurrentUser
      ? window.messageService?.sendDirectMessage(receiverPubKey!, gif)
      : window?.messageService?.sendPublicMessage(currentChannel, gif, [], "");
  };

  const sendMessage = () => {
    if (message.length !== 0 && !message.includes(UPLOADING)) {
      if (isCommunity) {
        if (!isActveUserRemoved) {
          window?.messageService?.sendPublicMessage(currentChannel, message, [], "");
        } else {
          error(_t("chat.message-warning"));
        }
      }
      if (isCurrentUser) {
        window.messageService?.sendDirectMessage(receiverPubKey!, message);
      }
      setMessage("");
      setIsMessageText(false);
    }
    if (
      receiverPubKey &&
      !props.chat.directContacts.some((contact) => contact.name === currentUser) &&
      isCurrentUser
    ) {
      window.messageService?.publishContacts(currentUser, receiverPubKey);
    }
  };

  const checkFile = (filename: string) => {
    const filenameLow = filename.toLowerCase();
    return ["jpg", "jpeg", "gif", "png"].some((el) => filenameLow.endsWith(el));
  };

  const fileInputChanged = (e: React.ChangeEvent<HTMLInputElement>): void => {
    let files = [...(e.target.files as FileList)].filter((i) => checkFile(i.name)).filter((i) => i);

    const {
      global: { isElectron }
    } = props;

    if (files.length > 0) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (files.length > 1 && isElectron) {
      let isWindows = process.platform === "win32";
      if (isWindows) {
        files = files.reverse();
      }
    }

    files.forEach((file) => upload(file));

    // reset input
    e.target.value = "";
  };
  const upload = async (file: File) => {
    const { activeUser, global } = props;

    const username = activeUser?.username!;

    const tempImgTag = `![Uploading ${file.name} #${Math.floor(Math.random() * 99)}]()\n\n`;

    setMessage(tempImgTag);

    let imageUrl: string;
    try {
      let token = getAccessToken(username);
      if (token) {
        const resp = await uploadImage(file, token);
        imageUrl = resp.url;

        if (global.usePrivate && imageUrl.length > 0) {
          addImage(username, imageUrl).then();
        }

        const imgTag = imageUrl.length > 0 && `![](${imageUrl})\n\n`;

        imgTag && setMessage(imgTag);
        setIsMessageText(true);
      } else {
        error(_t("editor-toolbar.image-error-cache"));
      }
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 413) {
        error(_t("editor-toolbar.image-error-size"));
      } else {
        error(_t("editor-toolbar.image-error"));
      }
      return;
    }
  };

  const handleMessage = (e: React.ChangeEvent<typeof FormControl & HTMLInputElement>) => {
    setMessage(e.target.value);
    setIsMessageText(e.target.value.length !== 0);
  };

  return (
    <div className={`chat ${isActveUserRemoved || !isCurrentUserJoined ? "disable" : ""}`}>
      <ClickAwayListener onClickAway={() => showEmojiPicker && setShowEmojiPicker(false)}>
        <div className="chatbox-emoji-picker">
          <div className="chatbox-emoji">
            <Tooltip content={_t("editor-toolbar.emoji")}>
              <div className="emoji-icon" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                {emoticonHappyOutlineSvg}
              </div>
            </Tooltip>
            {showEmojiPicker && (
              <EmojiPicker
                style={emojiPickerStyles}
                fallback={(e) => {
                  handleEmojiSelection(e);
                }}
              />
            )}
          </div>
        </div>
      </ClickAwayListener>

      {message.length === 0 && (
        <React.Fragment>
          <ClickAwayListener onClickAway={() => shGif && setShGif(false)}>
            <div className="chatbox-emoji-picker">
              <div className="chatbox-emoji">
                <Tooltip content={_t("Gif")}>
                  <div className="emoji-icon" onClick={toggleGif}>
                    {" "}
                    {gifIcon}
                  </div>
                </Tooltip>
                {shGif && (
                  <GifPicker
                    style={gifPickerStyle}
                    gifImagesStyle={GifImagesStyle}
                    shGif={true}
                    changeState={(gifState) => {
                      setShGif(gifState!);
                    }}
                    fallback={(e) => {
                      handleGifSelection(e);
                    }}
                  />
                )}
              </div>
            </div>
          </ClickAwayListener>

          <Tooltip content={"Image"}>
            <div
              className="chatbox-image"
              onClick={(e: React.MouseEvent<HTMLElement>) => {
                e.stopPropagation();
                const el = fileInput.current;
                if (el) el.click();
              }}
            >
              <div className="chatbox-image-icon">{chatBoxImageSvg}</div>
            </div>
          </Tooltip>

          <input
            onChange={fileInputChanged}
            className="file-input"
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple={true}
            style={{ display: "none" }}
          />
        </React.Fragment>
      )}

      <Form
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          e.stopPropagation();
          sendMessage();
        }}
        style={{ width: "100%" }}
      >
        <InputGroup className="chat-input-group">
          <Form.Control
            value={message}
            autoFocus={true}
            onChange={handleMessage}
            required={true}
            type="text"
            placeholder={_t("chat.start-chat-placeholder")}
            autoComplete="off"
            className="chat-input"
            style={{ maxWidth: "100%", overflowWrap: "break-word" }}
            disabled={(isCurrentUser && receiverPubKey) === undefined || isActveUserRemoved}
          />
          <InputGroup.Append
            className={`msg-svg ${isMessageText || message.length !== 0 ? "active" : ""}`}
            onClick={sendMessage}
          >
            {messageSendSvg}
          </InputGroup.Append>
        </InputGroup>
      </Form>
    </div>
  );
}
