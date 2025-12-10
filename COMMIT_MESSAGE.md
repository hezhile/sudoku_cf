fix: prevent multiple toast notifications on reset button click

- Add debouncing to checkAutoComplete function to prevent rapid successive calls
- Implement isResetting flag to skip input processing during board reset
- Add window._isResetting guard to prevent duplicate reset execution
- Prevent duplicate event handler registration in event bus
- Add initialization guards to controls module to avoid multiple bindings
- Add comprehensive debug logging for better issue tracking

The issue was caused by input events being triggered during board reset,
which led to multiple checkAutoComplete calls and subsequent toast
notifications. The fix ensures only one toast is shown when resetting
the game.

Fixes the reported bug where clicking reset would show 10 duplicate
toast messages saying "已重置" (Game Reset).