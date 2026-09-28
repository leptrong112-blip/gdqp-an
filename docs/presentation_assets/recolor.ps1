$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression
$src='D:\GDQP-WEBSITE - Copy\docs\HOC_QPAN_3D_LY_DO_CHUC_NANG_KY_THUAT.pptx'
$dst='D:\GDQP-WEBSITE - Copy\docs\HOC_QPAN_3D_LY_DO_CHUC_NANG_KY_THUAT_MAU_GOC.pptx'
[IO.File]::Copy($src,$dst,$true)
$f=[IO.File]::Open($dst,'Open','ReadWrite','None')
$z=[IO.Compression.ZipArchive]::new($f,[IO.Compression.ZipArchiveMode]::Update)
$darkSlides=@(1,3,7,11,14,19)
try {
 foreach($i in 1..19){
  $e=$z.GetEntry("ppt/slides/slide$i.xml")
  $r=[IO.StreamReader]::new($e.Open());[xml]$xml=$r.ReadToEnd();$r.Dispose()
  $dark=$darkSlides -contains $i
  $map=if($dark){@{'F4F7FA'='07111F';'102D47'='FFFFFF';'18354B'='C9D5E2';'526778'='B7C5D6';'FFFFFF'='11233B';'007E87'='F2B632';'E5F1F3'='11233B';'D5DFE7'='314259';'91AABD'='B7C5D6';'D23C50'='F0444A'}}else{@{'F4F7FA'='FCFAF6';'102D47'='132238';'18354B'='132238';'526778'='5C6B7C';'FFFFFF'='FFFFFF';'007E87'='D71920';'E5F1F3'='11233B';'D5DFE7'='CCD5DF';'91AABD'='91AABD';'D23C50'='D71920'}}
  foreach($c in $xml.SelectNodes('//*[local-name()="srgbClr"]')){if($map.ContainsKey($c.val)){$c.SetAttribute('val',$map[$c.val])}}
  foreach($shape in $xml.SelectNodes('//*[local-name()="sp"]')){
   $offset=$shape.SelectSingleNode('./*[local-name()="spPr"]/*[local-name()="xfrm"]/*[local-name()="off"]')
   $ext=$shape.SelectSingleNode('./*[local-name()="spPr"]/*[local-name()="xfrm"]/*[local-name()="ext"]')
   if(-not $offset){continue}
   $y=[double]$offset.y/12700;$w=[double]$ext.cx/12700
   # Keep callout copy readable against its navy bar.
   if($y -ge 466 -and $y -le 468){foreach($c in $shape.SelectNodes('.//*[local-name()="txBody"]//*[local-name()="srgbClr"]')){$c.SetAttribute('val',$(if($dark){'F2B632'}else{'FFFFFF'}))}}
   # Red header rule and alternating red/gold accents echo the reference deck.
   if($y -eq 0){foreach($c in $shape.SelectNodes('./*[local-name()="spPr"]//*[local-name()="srgbClr"]')){$c.SetAttribute('val','D71920')}}
   if($w -eq 4){$x=[double]$offset.x/12700; $accent=if($x -gt 450){'F2B632'}elseif($dark){'F0444A'}else{'D71920'};foreach($c in $shape.SelectNodes('./*[local-name()="spPr"]//*[local-name()="srgbClr"]')){$c.SetAttribute('val',$accent)}}
  }
  $e.Delete();$new=$z.CreateEntry("ppt/slides/slide$i.xml");$sw=[IO.StreamWriter]::new($new.Open(),[Text.UTF8Encoding]::new($false));$sw.Write($xml.OuterXml);$sw.Dispose()
 }
}finally{$z.Dispose();$f.Dispose()}
Write-Output $dst
