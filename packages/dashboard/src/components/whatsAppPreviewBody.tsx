import { Box, Stack } from "@mui/material";
import React from "react";

interface WhatsAppPreviewBodyProps {
    body: string;
}

function WhatsAppPreviewBody({ body }: WhatsAppPreviewBodyProps) {
    return (
        <Stack
            sx={{
                width: "100%",
                height: "100%",
                padding: 1,
                overflow: "hidden",
            }}
            direction="row"
            justifyContent="center"
            alignContent="center"
        >
            <Stack
                sx={{
                    height: "60rem",
                    width: "24rem",
                    backgroundImage:
                        "url(https://storage.googleapis.com/dittofeed-public/sms-box.svg)",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "contain",
                    backgroundPosition: "50% 0%",
                    justifyContent: "start",
                    alignItems: "center",
                }}
            >
                <Box
                    sx={{
                        width: "80%",
                        marginTop: 14,
                        backgroundColor: "#dcf8c6", // WhatsApp green-ish background
                        border: "1px solid #ebecf2",
                        padding: 1,
                        borderRadius: 1,
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                    }}
                >
                    {body}
                </Box>
            </Stack>
        </Stack>
    );
}

export default WhatsAppPreviewBody;
