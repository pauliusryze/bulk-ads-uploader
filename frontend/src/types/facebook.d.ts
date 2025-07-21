declare global {
  interface Window {
    FB: {
      init: (params: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: { authResponse?: { accessToken: string } }) => void,
        options?: { scope: string; return_scopes: boolean }
      ) => void;
      logout: (callback: () => void) => void;
    };
  }
}

export interface FacebookAuthResponse {
  authResponse?: {
    accessToken: string;
    userID: string;
    expiresIn: number;
    signedRequest: string;
  };
  status: 'connected' | 'not_authorized' | 'unknown';
}

export {}; 