import { onRequest as __api___route___ts_onRequest } from "/Users/abhisk/Desktop/Code-Nakshatra-2.0/client/functions/api/[[route]].ts"

export const routes = [
    {
      routePath: "/api/:route*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___route___ts_onRequest],
    },
  ]