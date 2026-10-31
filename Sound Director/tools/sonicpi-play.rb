## Play Sonic Pi code headlessly (no GUI needed), audibly, for N seconds.
##
## Usage (with Sonic Pi's bundled Ruby):
##   sonicpi-play.cmd FILE.rb [SECONDS]        run a file (default 20 s)
##   sonicpi-play.cmd -e "play 60" [SECONDS]   run inline code
##   echo "play 60" | sonicpi-play.cmd - 5     run code from stdin
##
## Boots the Sonic Pi daemon + SuperSonic engine, runs the code, streams every
## log/error line to stdout, then stops all jobs and shuts the engine down.
## Exit code is 1 if the run reported any runtime or syntax error.

SP_BIN = "C:/Program Files/Sonic Pi/app/server/ruby/bin"

args = ARGV.dup
silent = args.delete("--silent")   # checking a run for errors without sound: the engine's Windows audio session is muted
ENV["SONIC_PI_HOME"] = File.expand_path("../work/sp-home", __dir__) if silent
require File.join(SP_BIN, "headless_boot")
APPMUTE = File.expand_path("appmute.ps1", __dir__)
def app_mute(action)
  `powershell -NoProfile -ExecutionPolicy Bypass -File "#{APPMUTE}" #{action} "Sonic Pi - SuperSonic" 2>&1`.lines.last.to_s.strip
end
code =
  if args[0] == "-e"
    args.shift; args.shift
  elsif args[0] == "-"
    args.shift; STDIN.read
  else
    f = args.shift
    abort "Usage: sonicpi-play.rb FILE.rb|-e CODE|- [SECONDS]" unless f
    abort "File not found: #{f}" unless File.exist?(f)
    File.read(f)
  end
duration = (args[0] || "20").to_f

boot = SonicPi::HeadlessBoot.new
boot.boot!
if silent
  at_exit { app_mute("unmute") }
  boot.say "SILENT: #{app_mute('mute')}"
end
boot.say "READY - running for #{duration}s"
boot.run(code)
sleep duration
boot.say "done - stopping"
boot.stop_all
sleep 0.5
exit(boot.errors.empty? ? 0 : 1)
