#!/bin/sh
cd "$(dirname "$0")"
{ cat src/storyboard.head.html; echo '<script>'; cat src/harness.js src/porto-iso.js; echo '</script>'; cat src/storyboard.body.html; } > build/storyboard.html
