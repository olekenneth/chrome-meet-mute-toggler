import { Message } from "./events";

const meetTabIds = new Set<number>();

const doFocus = () => {
  const meetTabId = meetTabIds.values().next().value as number | undefined;
  if (meetTabId) {
    chrome.tabs.get(meetTabId, (meetTab) => {
      chrome.windows.update(meetTab.windowId, { focused: true });
      chrome.tabs.update(meetTabId, { active: true });
    });
  }
};

const doToggleMute = () => {
  const meetTabId = meetTabIds.values().next().value as number | undefined;
  if (meetTabId) {
    chrome.tabs.sendMessage(meetTabId, {});
  }
};

chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case "focus":
      doFocus();
      break;

    case "toggle-mute":
      doToggleMute();
      break;
  }
});

chrome.runtime.onMessage.addListener((msg: Message, sender, _sendResponse) => {
  const tabId = sender.tab?.id;
  if (!tabId) return;

  switch (msg.event) {
    case "EVENT_MUTE_STATE_CHANGED":
      fetch("http://localhost:29290/" + (msg.isMuted ? "mute" : "unmute")).then(
        (res) => res.json()
      );
      chrome.browserAction.setIcon({
        tabId,
        path: msg.isMuted
          ? "assets/icons/mic_off.png"
          : "assets/icons/mic_on.png",
      });

      break;

    case "EVENT_TAB_FOUND":
      meetTabIds[msg.isFound ? "add" : "delete"](tabId);
      console.log(meetTabIds);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  meetTabIds.delete(tabId);
});

chrome.browserAction.onClicked.addListener((tab) => {
  if (!tab.id) {
    return;
  }

  if (meetTabIds.has(tab.id)) {
    chrome.tabs.sendMessage(tab.id, {});
  } else {
    const meetTabId = meetTabIds.values().next().value as number | undefined;
    if (meetTabId) {
      chrome.tabs.get(meetTabId, (meetTab) => {
        chrome.windows.update(meetTab.windowId, { focused: true });
        chrome.tabs.update(meetTabId, { active: true });
      });
    }
  }
});
