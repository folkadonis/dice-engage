import { NativeConnection } from "@temporalio/worker";

import config from "../config";

export default async function createConnection() {
  const {
    temporalAddress,
    temporalClientCert,
    temporalClientKey,
    temporalServerNameOverride,
    temporalServerRootCa,
  } = config();

  const connection = await NativeConnection.connect({
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
  });
  return connection;
}
