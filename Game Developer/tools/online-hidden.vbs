' Runs online-loop.cmd without a window. The scheduled task "Zite world" (tools\install-autostart.cmd) calls this at logon.
Set sh = CreateObject("WScript.Shell")
here = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\") - 1)
sh.Run "cmd /c """ & here & "\online-loop.cmd""", 0, False
