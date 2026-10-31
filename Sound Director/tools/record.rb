## The studio's recorder: Sonic Pi code in, a WAV of the main mix out, in real time.
##
##   ruby.exe tools/record.rb -o OUT.wav -d SECONDS [-f FILE.rb | -e CODE] [-s SEED]
##
## Sonic Pi's own headless-record.rb talks to the engine over UDP, which SuperSonic ignores for recording (the spider
## talks to it over TCP), so it writes nothing. This one asks the spider to record, the same way the GUI's Rec button
## does: /start-recording, then the code, then /stop-recording and /save-recording PATH. The spider records to a temp
## file and moves it to PATH. Output is 48 kHz 24-bit stereo. Everything the run logs is printed.

require 'fileutils'

USAGE = "Usage: record.rb -o OUT.wav -d SECONDS [-e CODE | -f FILE.rb] [-s SEED] [--silent]"
out_path = duration = code = seed = nil
args = ARGV.dup
until args.empty?
  case (flag = args.shift)
  when "-o" then out_path = args.shift
  when "-d" then duration = args.shift
  when "-e" then code = args.shift
  when "-f" then path = args.shift; abort "File not found: #{path}" unless File.exist?(path); code = File.read(path)
  when "-s" then seed = args.shift
  when "--silent"
    # silent: the engine's Windows audio session is muted (its per-app volume) right after boot and unmuted at the end,
    # so it records without being heard. Its logs go to the studio's own Sonic Pi home, apart from Robin's.
    $silent = true
    ENV["SONIC_PI_HOME"] = File.expand_path("../work/sp-home", __dir__)
  else abort "Unknown argument: #{flag}\n#{USAGE}"
  end
end
require_relative "C:/Program Files/Sonic Pi/app/server/ruby/bin/headless_boot"

APPMUTE = File.expand_path("appmute.ps1", __dir__)
def app_mute(action)
  out = `powershell -NoProfile -ExecutionPolicy Bypass -File "#{APPMUTE}" #{action} "Sonic Pi - SuperSonic" 2>&1`
  out.lines.last.to_s.strip
end
abort USAGE unless out_path && duration && code
out_path = File.expand_path(out_path).tr("\\", "/")
duration = duration.to_f
FileUtils.mkdir_p(File.dirname(out_path))
File.delete(out_path) if File.exist?(out_path)
script = (seed ? "use_random_seed #{seed}\n" : "") + code

# the boot has no timeout of its own: when the engine cannot open the audio device (another engine still holds it, or
# Robin's app is running) the spider dies and boot! would wait forever. Give it 45 seconds, then fail loudly.
boot = nil
booter = Thread.new { boot = SonicPi::HeadlessBoot.new.boot! }
unless booter.join(45)
  STDOUT.puts "[  boot ] FAILED - the engine did not come up in 45 s (audio device busy? another Sonic Pi running?)"
  STDOUT.flush
  exit 3
end
if $silent
  at_exit { app_mute("unmute") }
  boot.say "SILENT: #{app_mute('mute')}"
end
boot.eval_client.send("/start-recording", boot.token)
sleep 0.4
boot.say "READY - recording #{duration}s to #{out_path}"
boot.run(script)
sleep duration
boot.eval_client.send("/stop-recording", boot.token)
# the engine closes the file in its own time (a 200 s take is 58 MB); a save asked too early finds nothing to move.
# So: wait, ask, and ask again every few seconds until the file is there, up to a minute.
sleep 3
12.times do
  boot.eval_client.send("/save-recording", boot.token, out_path)
  20.times { break if File.exist?(out_path) && File.size(out_path) > 44; sleep 0.25 }
  break if File.exist?(out_path) && File.size(out_path) > 44
end
sleep 0.5
boot.stop_all
sleep 0.5
boot.say "ERRORS: #{boot.errors.join(' | ')}" unless boot.errors.empty?
if File.exist?(out_path) && File.size(out_path) > 44
  boot.say "WROTE #{out_path} (#{File.size(out_path)} bytes)"
  exit(boot.errors.empty? ? 0 : 2)
else
  boot.say "FAILED - no output written"
  exit 1
end
