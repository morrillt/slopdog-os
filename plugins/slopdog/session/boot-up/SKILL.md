---
name: boot-up
description: >-
  Bring the Slopdog screens back up after a reboot or a closed window: the Universe UI as a chromeless window on workspace 1 (comms), the ticket board on workspace 3 and the Gist Tray side window. Use when Todd says "boot up", "/slopdog:boot-up", "open the slopdog UI", "bring everything up after a reboot", or "bring the board back".
allowed-tools:
  - Bash
disable-model-invocation: true
---

# boot-up — the Slopdog screens, up

Every step is idempotent: a screen already up is left alone.

1. **Start the Universe server** if it is not answering:

   ```bash
   [ "$(curl -s -o /dev/null -w '%{http_code}' localhost:8740/shell/)" = 200 ] || ~/slopdog/v2/desks/ideas/evolution/start.sh server
   ```

2. **Open the Universe chromeless on workspace "1 (comms)"**, unless a window titled
   "Solar system · Slopdog" is already there. Remember the focused workspace first, then
   put the window on workspace 1 and switch back:

   ```bash
   export DISPLAY=:0; export I3SOCK=$(ls /run/user/1000/i3/ipc-socket.* | head -1)
   HERE=$(i3-msg -t get_workspaces | python3 -c 'import json,sys; print(next(w["name"] for w in json.load(sys.stdin) if w["focused"]))')
   if ! i3-msg -t get_tree | grep -q 'Solar system · Slopdog'; then
     i3-msg 'workspace "1 (comms)"; exec --no-startup-id systemd-run --user --scope --unit=slopdog-universe --property=MemoryHigh=2G --property=MemoryMax=3G --property=MemorySwapMax=512M chromium --app=http://localhost:8740/shell/'
     (Plain `chromium` resolves to `~/.local/bin/chromium`, which makes the window dark and gives it its own process; never call `/snap/bin/chromium` here. IT memory `agent-chromium-wrapper`.)
     (The `systemd-run --user --scope` wrapper is what puts the Universe under a memory cap of its own, the way `~/.config/systemd/user/kitty-.scope.d/memory.conf` caps herdr and the desks. Todd asked for the Universe to be in that group on 2026-10-11, after a memory exhaustion froze the machine. The cap covers only this window; Todd's own browsing is never capped. If the unit name is already taken because a stale scope survived, `systemctl --user stop slopdog-universe.scope` first.)
     sleep 5
   fi
   i3-msg "workspace \"$HERE\""
   ```

3. **Run the board and the Gist Tray**, which restarts the board on :3008 (workspace 3) and the
   tray if either is missing:

   ```bash
   node ~/scripts/board-and-tray.mjs
   ```

4. **Confirm what is up**: list window titles per workspace from `i3-msg -t get_tree`, and
   check the focused workspace is the one Todd was on before step 2.

5. **Say in one line** what came up, naming any screen that did not.
