## Send code to an ALREADY RUNNING Sonic Pi GUI, so it plays through the app
## the user has open and output shows in its log pane.
##
## Usage:
##   sonicpi-gui.cmd FILE.rb        run a file in the open GUI
##   sonicpi-gui.cmd -e "play 60"   run inline code
##   sonicpi-gui.cmd --stop         stop all running jobs
##
## Ports and the auth token are read from ~/.sonic-pi/log/gui.log, which the
## GUI writes when it boots the daemon.

SP_LIB = "C:/Program Files/Sonic Pi/app/server/ruby/lib/sonicpi"
require File.join(SP_LIB, "osc/osc")

log = File.join(ENV["USERPROFILE"], ".sonic-pi", "log", "gui.log")
abort "No gui.log found - has Sonic Pi ever been started?" unless File.exist?(log)
vals = File.read(log).scan(/daemon_stdout: (\d+)/).flatten.map(&:to_i).last(6)
abort "Could not read ports/token from gui.log" unless vals.size == 6
daemon_port, gui_listen, gui_send, sc_port, cues, token = vals

running = `tasklist /FI "IMAGENAME eq sonic-pi.exe" /NH 2>nul`.include?("sonic-pi.exe")
abort "Sonic Pi GUI is not running. Start it, or use sonicpi-play.cmd instead." unless running

client = SonicPi::OSC::UDPClient.new("localhost", gui_send)
case ARGV[0]
when "--stop"
  client.send("/stop-all-jobs", token)
  puts "Sent stop-all-jobs to Sonic Pi (port #{gui_send})"
when "-e"
  client.send("/run-code", token, ARGV[1].to_s)
  puts "Sent code to Sonic Pi (port #{gui_send})"
when nil
  abort "Usage: sonicpi-gui.rb FILE.rb | -e CODE | --stop"
else
  abort "File not found: #{ARGV[0]}" unless File.exist?(ARGV[0])
  client.send("/run-code", token, File.read(ARGV[0]))
  puts "Sent #{ARGV[0]} to Sonic Pi (port #{gui_send})"
end
