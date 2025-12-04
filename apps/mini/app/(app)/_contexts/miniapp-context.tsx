"use client";

import type {
  MiniAppContext as FarcasterMiniAppContext,
  SafeAreaInsets,
} from "@farcaster/miniapp-core/dist/context";
import type { MiniAppHostCapability } from "@farcaster/miniapp-sdk";
import * as React from "react";
import { SafeArea } from "@coinbase/onchainkit/minikit";
import { sdk as miniappSdk } from "@farcaster/miniapp-sdk";

const DEFAULT_SAFE_AREA_INSETS: SafeAreaInsets = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

interface MiniAppState {
  isMiniAppReady: boolean;
  isInMiniApp: boolean;
  context: FarcasterMiniAppContext | null;
  capabilities: MiniAppHostCapability[] | null;
  safeAreaInsets: SafeAreaInsets;
  error: string | null;
}

type MiniAppContextType = MiniAppState;

const initialState: MiniAppState = {
  isMiniAppReady: false,
  isInMiniApp: false,
  context: null,
  capabilities: null,
  safeAreaInsets: DEFAULT_SAFE_AREA_INSETS,
  error: null,
};

type MiniAppAction =
  | {
      type: "LOADING_COMPLETE";
      payload: { context: FarcasterMiniAppContext; isInMiniApp: boolean };
    }
  | { type: "SET_CAPABILITIES"; payload: MiniAppHostCapability[] }
  | { type: "SET_ERROR"; payload: string }
  | { type: "RESET_ERROR " };

function miniAppReducer(
  state: MiniAppState,
  action: MiniAppAction,
): MiniAppState {
  switch (action.type) {
    case "LOADING_COMPLETE":
      return {
        ...state,
        isMiniAppReady: true,
        isInMiniApp: action.payload.isInMiniApp,
        context: action.payload.context,
        safeAreaInsets:
          action.payload.context.client.safeAreaInsets ??
          DEFAULT_SAFE_AREA_INSETS,
        error: null,
      };
    case "SET_CAPABILITIES":
      return {
        ...state,
        capabilities: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };
    case "RESET_ERROR ":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

export const MiniAppContext = React.createContext<
  MiniAppContextType | undefined
>(undefined);

export function MiniAppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(miniAppReducer, initialState);

  const loadMiniApp = React.useCallback(async () => {
    console.log("Loading mini app context...");
    try {
      await miniappSdk.actions.ready();

      const isInMiniApp = await miniappSdk.isInMiniApp();
      const context = await miniappSdk.context;

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!context) {
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to load mini app context",
        });
        return;
      }

      dispatch({
        type: "LOADING_COMPLETE",
        payload: { context, isInMiniApp },
      });

      try {
        const capabilities = await miniappSdk.getCapabilities();
        dispatch({ type: "SET_CAPABILITIES", payload: capabilities });
      } catch (e) {
        console.error("Error fetching mini app capabilities:", e);
      }
    } catch (e) {
      console.error("Error initializing mini app:", e);
      dispatch({
        type: "SET_ERROR",
        payload:
          e instanceof Error
            ? e.message
            : "Unknown error initializing mini app",
      });
    }
  }, []);

  React.useEffect(() => {
    void loadMiniApp();
  }, [loadMiniApp]);

  return (
    <MiniAppContext value={state}>
      <SafeArea>{children}</SafeArea>
    </MiniAppContext>
  );
}

MiniAppProvider.displayName = "MiniAppProvider";

export function useMiniApp(): MiniAppContextType {
  const context = React.use(MiniAppContext);
  if (!context) {
    throw new Error("useMiniApp must be used within a MiniAppProvider");
  }
  return context;
}

export function useAddMiniApp() {
  return React.useCallback(async () => {
    try {
      const result = await miniappSdk.actions.addMiniApp();
      if (result.notificationDetails) {
        // handled in webhook
        console.log("Mini App added with notifications:", { result });
      } else {
        console.warn("Mini App added without notifications");
      }
    } catch (error) {
      console.error("Error adding mini app:", error);
    }
  }, []);
}
