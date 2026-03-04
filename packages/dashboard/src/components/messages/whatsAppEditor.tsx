import { lintGutter } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import CloseIcon from "@mui/icons-material/Close";
import {
    Autocomplete,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    TextField,
    useTheme,
} from "@mui/material";
import ReactCodeMirror from "@uiw/react-codemirror";
import {
    ChannelType,
    CompletionStatus,
    RenderMessageTemplateRequestContents,
    RenderMessageTemplateType,
    UserPropertyDefinitionType,
    WorkspaceMemberResource,
} from "isomorphic-lib/src/types";
import React, { useMemo } from "react";

import { useAppStorePick } from "../../lib/appStore";
import TemplateEditor, {
    DraftToPreview,
    RenderEditorParams,
    TemplateEditorMode,
} from "../templateEditor";
import WhatsAppPreviewBody from "../whatsAppPreviewBody";

function WhatsAppOptions({ draft, setDraft, disabled }: RenderEditorParams) {
    const [open, setOpen] = React.useState(false);
    const { userProperties } = useAppStorePick(["userProperties"]);

    const recipientOptions = useMemo(() => {
        if (userProperties.type !== CompletionStatus.Successful) {
            return [];
        }
        return userProperties.value
            .filter((up) => up.definition.type === UserPropertyDefinitionType.Trait)
            .map((up) => up.name);
    }, [userProperties]);

    if (draft.type !== ChannelType.WhatsApp) {
        return null;
    }

    return (
        <>
            <Button onClick={() => setOpen(true)}> Options </Button>
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        WhatsApp Options
                        <IconButton onClick={() => setOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Stack sx={{ pt: 1 }}>
                        <Autocomplete
                            value={draft.identifierKey ?? null}
                            onChange={(_event, value) => {
                                setDraft((defn) => {
                                    if (defn.type !== ChannelType.WhatsApp) {
                                        return defn;
                                    }
                                    return { ...defn, identifierKey: value ?? undefined };
                                });
                            }}
                            options={recipientOptions}
                            disabled={disabled}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Recipient User Property"
                                    variant="outlined"
                                    helperText="Override the default 'phone' user property for the recipient number"
                                />
                            )}
                        />
                    </Stack>
                </DialogContent>
            </Dialog>
        </>
    );
}

function fieldToReadable(field: string) {
    switch (field) {
        case "body":
            return "Body";
        default:
            return null;
    }
}

const draftToPreview: DraftToPreview = (definition) => {
    if (definition.type !== ChannelType.WhatsApp) {
        throw new Error("Invalid channel type");
    }
    const content: RenderMessageTemplateRequestContents = {
        body: {
            type: RenderMessageTemplateType.PlainText,
            value: definition.body,
        },
    };
    return content;
};

export default function WhatsAppEditor({
    templateId: messageId,
    hideTitle,
    hidePublisher,
    disabled,
    member,
    mode,
    defaultIsUserPropertiesMinimised,
    hideUserPropertiesPanel,
    hideEditor,
}: {
    templateId: string;
    hideTitle?: boolean;
    hidePublisher?: boolean;
    disabled?: boolean;
    member?: WorkspaceMemberResource;
    mode?: TemplateEditorMode;
    defaultIsUserPropertiesMinimised?: boolean;
    hideUserPropertiesPanel?: boolean;
    hideEditor?: boolean;
}) {
    const theme = useTheme();

    return (
        <TemplateEditor
            templateId={messageId}
            channel={ChannelType.WhatsApp}
            member={member}
            disabled={disabled}
            hideTitle={hideTitle}
            hidePublisher={hidePublisher}
            renderEditorOptions={(params) => <WhatsAppOptions {...params} />}
            renderEditorHeader={() => null}
            renderEditorBody={({ draft, setDraft }) => {
                if (draft.type !== ChannelType.WhatsApp) {
                    return null;
                }
                return (
                    <ReactCodeMirror
                        value={draft.body}
                        onChange={(value) => {
                            setDraft((defn) => {
                                if (defn.type !== ChannelType.WhatsApp) {
                                    return defn;
                                }
                                defn.body = value;
                                return defn;
                            });
                        }}
                        readOnly={disabled}
                        extensions={[
                            EditorView.theme({
                                "&": {
                                    fontFamily: theme.typography.fontFamily,
                                },
                            }),
                            EditorView.lineWrapping,
                            lintGutter(),
                        ]}
                    />
                );
            }}
            renderPreviewHeader={() => null}
            renderPreviewBody={({ rendered }) => {
                if (!rendered.body) return null;
                return <WhatsAppPreviewBody body={rendered.body} />;
            }}
            draftToPreview={draftToPreview}
            fieldToReadable={fieldToReadable}
            mode={mode}
            defaultIsUserPropertiesMinimised={defaultIsUserPropertiesMinimised}
            hideUserPropertiesPanel={hideUserPropertiesPanel}
            hideEditor={hideEditor}
        />
    );
}
