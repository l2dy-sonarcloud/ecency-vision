import { getAccountFull } from "../../../api/hive";

export const getUserChatPublicKey = async (username: string): Promise<string | undefined> => {
  const response = await getAccountFull(username);
  if (response && response.posting_json_metadata) {
    const { posting_json_metadata } = response;
    const profile = JSON.parse(posting_json_metadata).profile;
    if (profile) {
      const { nsPubKey } = profile || {};
      return nsPubKey;
    }
  }
  return undefined;
};
