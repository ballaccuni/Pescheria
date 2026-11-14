#!/bin/sh
# Assembles the self-contained pages from src/.
cd "$(dirname "$0")"
{ cat src/storyboard.head.html; echo '<script>'; cat src/harness.js src/porto.js; echo '</script>'; cat src/storyboard.body.html; } > build/storyboard.html
{ cat src/player.head.html; echo '<script>'; cat src/harness.js src/sound.js src/porto.js src/score.js; echo '</script>'; cat src/player.body.html; } > build/porto-explainer.html
