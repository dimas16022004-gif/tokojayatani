$wshShell = New-Object -ComObject WScript.Shell

# Path Desktop User
$desktopPath = [System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), 'Toko Jaya Tani.lnk')
$shortcutDesktop = $wshShell.CreateShortcut($desktopPath)
$shortcutDesktop.TargetPath = 'c:\xampp\htdocs\TokoJayaTani\Jalankan_Toko_Jaya_Tani.bat'
$shortcutDesktop.WorkingDirectory = 'c:\xampp\htdocs\TokoJayaTani'
$shortcutDesktop.Description = 'Jalankan Aplikasi Kasir & Stok Toko Jaya Tani'
$shortcutDesktop.IconLocation = 'shell32.dll,282' # Ikon Toko/Belanja Windows
$shortcutDesktop.Save()

# Path Folder Project
$projectShortcutPath = 'c:\xampp\htdocs\TokoJayaTani\Toko Jaya Tani.lnk'
$shortcutProject = $wshShell.CreateShortcut($projectShortcutPath)
$shortcutProject.TargetPath = 'c:\xampp\htdocs\TokoJayaTani\Jalankan_Toko_Jaya_Tani.bat'
$shortcutProject.WorkingDirectory = 'c:\xampp\htdocs\TokoJayaTani'
$shortcutProject.Description = 'Jalankan Aplikasi Kasir & Stok Toko Jaya Tani'
$shortcutProject.IconLocation = 'shell32.dll,282'
$shortcutProject.Save()

Write-Output "Shortcut berhasil dibuat di Desktop dan Folder Project!"
