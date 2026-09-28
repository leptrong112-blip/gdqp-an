$ErrorActionPreference='Stop'
$root='D:\GDQP-WEBSITE - Copy\docs\presentation_assets\slides_mau_goc'
[IO.Directory]::CreateDirectory($root)|Out-Null
$app=New-Object -ComObject PowerPoint.Application
$p=$null
try{
 $p=$app.Presentations.Open('D:\GDQP-WEBSITE - Copy\docs\HOC_QPAN_3D_LY_DO_CHUC_NANG_KY_THUAT_MAU_GOC.pptx',-1,0,0)
 for($i=1;$i -le $p.Slides.Count;$i++){$p.Slides.Item($i).Export((Join-Path $root ('slide-{0:00}.png' -f $i)),'PNG',1280,720)}
 Write-Output ('SLIDES='+$p.Slides.Count)
}finally{if($p){$p.Close();[void][Runtime.InteropServices.Marshal]::ReleaseComObject($p)};$app.Quit();[void][Runtime.InteropServices.Marshal]::ReleaseComObject($app);[GC]::Collect();[GC]::WaitForPendingFinalizers()}
