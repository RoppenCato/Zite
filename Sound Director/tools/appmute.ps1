# appmute: mute or unmute the Windows audio sessions of one program (the per-app volume in the Volume Mixer), nothing else.
#   powershell -ExecutionPolicy Bypass -File tools\appmute.ps1 mute   "Sonic Pi - SuperSonic"
#   powershell -ExecutionPolicy Bypass -File tools\appmute.ps1 unmute "Sonic Pi - SuperSonic"
#   powershell -ExecutionPolicy Bypass -File tools\appmute.ps1 list
# Used by tools\record.rb --silent so the studio's engine records without being heard. Windows remembers an app's mute,
# so every silent run unmutes at its end; if one crashed, run tools\unmute.cmd.
param([string]$Action = 'list', [string]$Name = 'Sonic Pi - SuperSonic')

$src = @'
using System;
using System.Runtime.InteropServices;
namespace AppMute {
  [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumeratorCom {}
  [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  public interface IMMDeviceEnumerator {
    int EnumAudioEndpoints(int dataFlow, int stateMask, out IntPtr devices);
    int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice device);
  }
  [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  public interface IMMDevice {
    int Activate(ref Guid iid, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object iface);
  }
  [Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  public interface IAudioSessionManager2 {
    int GetAudioSessionControl(ref Guid sessionGuid, int streamFlags, out IntPtr sessionControl);
    int GetSimpleAudioVolume(ref Guid sessionGuid, int streamFlags, out IntPtr audioVolume);
    int GetSessionEnumerator(out IAudioSessionEnumerator sessionEnum);
  }
  [Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  public interface IAudioSessionEnumerator {
    int GetCount(out int count);
    int GetSession(int index, out IAudioSessionControl2 session);
  }
  [Guid("bfb7ff88-7239-4fc9-8fa2-07c950be9c6d"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  public interface IAudioSessionControl2 {
    int GetState(out int state);
    int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string name);
    int SetDisplayName([MarshalAs(UnmanagedType.LPWStr)] string name, ref Guid eventContext);
    int GetIconPath([MarshalAs(UnmanagedType.LPWStr)] out string path);
    int SetIconPath([MarshalAs(UnmanagedType.LPWStr)] string path, ref Guid eventContext);
    int GetGroupingParam(out Guid groupingParam);
    int SetGroupingParam(ref Guid groupingParam, ref Guid eventContext);
    int RegisterAudioSessionNotification(IntPtr client);
    int UnregisterAudioSessionNotification(IntPtr client);
    int GetSessionIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string id);
    int GetSessionInstanceIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string id);
    int GetProcessId(out uint pid);
    int IsSystemSoundsSession();
    int SetDuckingPreference(bool optOut);
  }
  [Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  public interface ISimpleAudioVolume {
    int SetMasterVolume(float level, ref Guid eventContext);
    int GetMasterVolume(out float level);
    int SetMute(bool mute, ref Guid eventContext);
    int GetMute(out bool mute);
  }
  public class Session { public uint Pid; public bool Muted; public float Volume; public ISimpleAudioVolume Vol; }
  public static class Sessions {
    public static Session[] List() {
      var en = (IMMDeviceEnumerator)new MMDeviceEnumeratorCom();
      IMMDevice dev; en.GetDefaultAudioEndpoint(0, 1, out dev);     // eRender, eMultimedia
      Guid iid = typeof(IAudioSessionManager2).GUID; object o; dev.Activate(ref iid, 23, IntPtr.Zero, out o);
      var mgr = (IAudioSessionManager2)o; IAudioSessionEnumerator se; mgr.GetSessionEnumerator(out se);
      int n; se.GetCount(out n); var list = new System.Collections.Generic.List<Session>();
      for (int i = 0; i < n; i++) {
        IAudioSessionControl2 c; se.GetSession(i, out c); uint pid; c.GetProcessId(out pid);
        var v = (ISimpleAudioVolume)c; bool m; v.GetMute(out m); float lv; v.GetMasterVolume(out lv);
        list.Add(new Session { Pid = pid, Muted = m, Volume = lv, Vol = v });
      }
      return list.ToArray();
    }
    public static void SetMute(Session s, bool mute) { Guid g = Guid.Empty; s.Vol.SetMute(mute, ref g); }
  }
}
'@
if (-not ([System.Management.Automation.PSTypeName]'AppMute.Sessions').Type) { Add-Type -TypeDefinition $src }

$sessions = [AppMute.Sessions]::List()
$changed = 0
foreach ($s in $sessions) {
  $p = Get-Process -Id $s.Pid -ErrorAction SilentlyContinue
  $pname = if ($p) { $p.ProcessName } else { '(none)' }
  if ($Action -eq 'list') { "{0,6}  {1,-30} muted={2} volume={3:n2}" -f $s.Pid, $pname, $s.Muted, $s.Volume; continue }
  if ($pname -eq $Name) {
    [AppMute.Sessions]::SetMute($s, ($Action -eq 'mute'))
    "$Action $pname (pid $($s.Pid))"; $changed++
  }
}
if ($Action -ne 'list') { "$changed session(s) $($Action)d" }
