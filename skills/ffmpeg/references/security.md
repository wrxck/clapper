# Security reference

ffmpeg parses dozens of container and codec formats written in C, much of it
decades old, and runs that code over whatever bytes you hand it. Input media is
attacker-controlled data. Treat every file from outside your control as hostile
and you avoid almost all of the real risk.

## Keep ffmpeg current

Memory-safety bugs in demuxers and decoders are found and patched continuously.
Through 2025 and 2026 a wave of these landed across the TS, HLS and DASH
demuxers and the JPEG2000 decoder, several reachable purely by feeding a crafted
file to a default ffmpeg invocation and at least one classed remote-code-execution.
Older builds simply carry the unpatched versions of these.

Check what you have:

```bash
ffmpeg -version
```

Read the first line (for example `ffmpeg version 8.1.1`). As of mid-2026 the
current stable major is 8.1 (first released 2026-03-16); 8.0 (2025-08-22) is
still supported and 7.1 (2024-09-30) is the LTS branch. Anything 6.x or older is
outside the comfortable support window.

Update it:

- macOS: `brew upgrade ffmpeg`
- Debian/Ubuntu: `sudo apt update && sudo apt upgrade ffmpeg` (distro packages
  lag; for the newest build use a static build)
- Fedora/RHEL: `sudo dnf upgrade ffmpeg`
- Windows: `winget upgrade Gyan.FFmpeg` or `choco upgrade ffmpeg-full`
- Static builds (newest, any OS): BtbN (github.com/BtbN/FFmpeg-Builds),
  gyan.dev (Windows), evermeet.cx (macOS). Verify downloads against the
  published PGP signatures per ffmpeg.org/download.html before trusting them.

Track advisories at ffmpeg.org/security.html and your distro's security feed. In
CI, pin a known-good version and bump it deliberately rather than letting an
unpinned `apt install` drift.

## Processing untrusted media

When the file came from a user, the internet, or any source you do not control:

1. Use the newest ffmpeg you have.
2. Run it isolated: a container or sandbox with no network, a non-root user, a
   read-only filesystem except the output directory, and a wall-clock and memory
   limit. A malformed file should be able to crash the process, not your host.
3. Constrain what ffmpeg will do with the bytes:
   - `-nostdin` so it cannot block reading from or be driven via stdin.
   - `-xerror` to abort on the first decode error instead of soldiering on.
   - Pin the input demuxer with `-f <format>` when you know the type, so a file
     lying about its contents is not handed to an unexpected parser.
   - Disallow protocol surprises: a malicious playlist or input can reference
     remote or local URLs. Restrict with
     `-protocol_whitelist file,crypto` (add `http,https,tcp,tls` only if you
     genuinely need network input), and avoid passing untrusted `concat:` or
     playlist inputs.
4. Validate cheaply first with `ffprobe` (same isolation applies) and reject
   anything whose streams, duration, or dimensions are implausible before you
   spend a full decode on it.

Example hardened transcode of an untrusted upload (still run inside a sandbox):

```bash
ffmpeg -nostdin -xerror \
  -protocol_whitelist file,crypto \
  -i "$INPUT" \
  -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart \
  -t 600 \
  "$OUTPUT"
```

`-t 600` caps output duration as a backstop against a file that claims to be
enormous. `"$INPUT"`/`"$OUTPUT"` are passed as single quoted arguments, never
interpolated into a larger command line.

## Shell-injection-safe command construction

The classic mistake is building one shell string out of user input:

- Never do this. A filename, caption, or filter value supplied by a user is
  attacker-controlled. If you build a shell command by string concatenation, a
  filename such as one containing `; rm -rf ~` or backticks executes as a shell
  command, not as a filename.

Rules:

1. Build the command as an argument array and run it without a shell. Each
   user-supplied value is one array element, so the shell never re-parses it.
2. If you must use a shell, do not interpolate untrusted values; pass them as
   positional parameters or environment variables.
3. Keep untrusted text out of filtergraphs. drawtext text, subtitle paths and
   overlay parameters are part of ffmpeg's own mini-language with their own
   escaping rules; feed dynamic text via `textfile=` and dynamic subtitle paths
   by changing directory and passing a plain basename, rather than splicing the
   value into the `-vf` string.
4. Treat output paths as carefully as input paths; do not let a user choose a
   path that overwrites something sensitive, and add `-y`/`-n` deliberately so
   overwrite behaviour is explicit rather than an interactive prompt.

Node.js, argument array (safe) versus a shell string (unsafe):

```js
// safe: no shell, each value is a discrete argument
import { execFile } from "node:child_process";
execFile("ffmpeg", [
  "-nostdin", "-i", userInputPath,
  "-c:v", "libx264", "-crf", "23", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-movflags", "+faststart",
  outputPath,
]);

// unsafe: never build a shell string from untrusted values
// exec("ffmpeg -i " + userInputPath + " out.mp4")  // do not do this
```

Python, `subprocess` with a list (safe):

```python
import subprocess
subprocess.run(
    ["ffmpeg", "-nostdin", "-i", user_input_path,
     "-c:v", "libx264", "-crf", "23", "-pix_fmt", "yuv420p",
     "-c:a", "aac", "-movflags", "+faststart", output_path],
    check=True,
)
# never: subprocess.run(f"ffmpeg -i {user_input_path} out.mp4", shell=True)
```

The shape is the same in any language: an argv array passed straight to the
binary, with `shell=True` / shell interpolation avoided.

## Resource limits

A decode can be made to consume unbounded CPU, memory, time or disk. Bound all
four:

- Time: a wall-clock timeout around the process (`timeout 600 ffmpeg ...` on
  Linux, or your runtime's process timeout) plus `-t` to cap output duration.
- Threads/CPU: `-threads N` to cap encoder threads; combine with cgroup/container
  CPU quotas.
- Memory: enforce with the container/cgroup (`--memory` on Docker) rather than
  trusting ffmpeg to self-limit.
- Output size: cap with `-fs <bytes>` (file size limit) so a runaway encode
  cannot fill the disk; for example `-fs 500M`.
- Frame/dimension sanity: reject implausible inputs at the `ffprobe` stage; a
  file claiming a 100000x100000 frame should be rejected before decode, not
  after it has tried to allocate the buffer.

Defence in depth: even with all of the above, run untrusted decodes in a
disposable, network-isolated sandbox. The flags reduce the blast radius; the
sandbox contains what gets through.
