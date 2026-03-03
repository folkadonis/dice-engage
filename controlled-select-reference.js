"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var material_1 = require("@mui/material");
var stopPropagation = function (e) {
    e.stopPropagation();
};
var FlowSelect = function (_a) {
    var options = _a.options;
    var _b = (0, react_1.useState)(''), value = _b[0], setValue = _b[1];
    var _c = (0, react_1.useState)(false), open = _c[0], setOpen = _c[1];
    var handleChange = function (e) {
        setValue(e.target.value);
    };
    var handleOpen = function (e) {
        stopPropagation(e);
        setOpen(true);
    };
    var handleClose = function (e) {
        stopPropagation(e);
        setOpen(false);
    };
    return fullWidth;
    size = "small" >
        id;
    "flow-select-label" > Choose < /InputLabel>
        < material_1.Select;
    labelId = "flow-select-label";
    id = "flow-select";
    value = { value: value };
    open = { open: open };
    onOpen = { handleOpen: handleOpen };
    onClose = { handleClose: handleClose };
    onChange = { handleChange: handleChange };
    // prevent React Flow from hijacking pointer events on the trigger
    onMouseDownCapture = { stopPropagation: stopPropagation };
    onTouchStartCapture = { stopPropagation: stopPropagation };
    onPointerDownCapture = { stopPropagation: stopPropagation };
    MenuProps = {};
    {
        // render the menu inside the node so its events bubble through our wrapper
        disablePortal: true,
            PaperProps;
        {
            // also block pointer events coming *out* of the menu itself
            onMouseDownCapture: stopPropagation,
                onTouchStartCapture;
            stopPropagation,
                onPointerDownCapture;
            stopPropagation,
            ;
        }
    }
};
    >
        { options: options, : .map(function (opt) { return key = { opt: opt, : .value }; }, value = { opt: opt, : .value } >
                { opt: opt, : .label }
                < /MenuItem>) }
    < /Select>
    < /FormControl>;
;
;
exports.default = FlowSelect;
