import { Connection } from "@temporalio/client";

import config from "../config";

let CONNECTION: Connection | null = null;

export default async function connect(): Promise<Connection> {
  if (!CONNECTION) {
    const {
      temporalAddress,
      temporalConnectionTimeout,
      temporalClientCert,
      temporalClientKey,
      temporalServerNameOverride,
      temporalServerRootCa,
    } = config();

    const connection = await Connection.connect({
      address: temporalAddress,
      tls:
        temporalClientCert && temporalClientKey
          ? {
            clientCertPair: {
              crt: new TextEncoder().encode(temporalClientCert),
              key: new TextEncoder().encode(temporalClientKey),
            },
            serverNameOverride: temporalServerNameOverride,
            serverRootCACertificate: temporalServerRootCa
              ? new TextEncoder().encode(temporalServerRootCa)
              : undefined,
          }
          : undefined,
      ...(temporalConnectionTimeout !== undefined
        ? { connectTimeout: temporalConnectionTimeout }
        : {}),
    });
    CONNECTION = connection;
  }
  return CONNECTION;
}
