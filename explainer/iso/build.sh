#!/bin/sh
# Assembles the self-contained pages from src/ (shared H library and SOUND kit live in ../src).
cd "$(dirname "$0")"
{ cat src/storyboard.head.html; echo '<script>'; cat ../src/harness.js src/porto-iso.js; echo '</script>'; cat src/storyboard.body.html; } > build/storyboard.html
{ cat src/player.head.html; echo '<script>'; cat ../src/harness.js ../src/sound.js src/porto-iso.js src/score-iso.js; echo '</script>'; cat src/player.body.html; } > build/porto-iso.html
