import ky from "ky";

export const api = ky.create({
  prefixUrl: typeof window !== "undefined" ? "/api" : "",
  retry: {
    limit: 2,
    methods: ["get"],
    statusCodes: [429, 500, 502, 503, 504],
  },
});

