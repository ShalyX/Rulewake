param(
  [string]$OutputDirectory = ".\assets\voice",
  [string]$MetadataPath = ".\audio_meta.json",
  [string]$VoiceName = "Microsoft Mark",
  [int]$Rate = 1
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech

$lines = @(
  @{ Frame = 1; Duration = 5.0; Text = "A collateral rule changes. Your account changes with it - before you place another trade." },
  @{ Frame = 2; Duration = 7.0; Text = "Rulewake shows that consequence before you decide: the rule, the propagation path, and the account state it creates." },
  @{ Frame = 3; Duration = 9.0; Text = "Start with the verified input. Here, r S T R C collateral moves from ninety percent to eighty-five. One change enters the field." },
  @{ Frame = 4; Duration = 11.0; Text = "The deterministic core carries it through: collateral value falls five thousand dollars; margin ratio moves from ninety-four point four four to one hundred percent; warning becomes critical." },
  @{ Frame = 5; Duration = 10.0; Text = "Then Qwen explains what the core already proved. It cannot invent new numbers: the numeric allowlist passes, and the explanation stays grounded in the trace." },
  @{ Frame = 6; Duration = 10.0; Text = "Inspect the rule. See the wake. Restore a seventy-five percent target with twenty-eight thousand, three hundred thirty-three dollars and thirty-four cents - or make a different call. You decide." }
)

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
$resolvedMetadata = [System.IO.Path]::GetFullPath($MetadataPath)
[System.IO.Directory]::CreateDirectory($resolvedOutput) | Out-Null

$existingSfx = @()
if (Test-Path -LiteralPath $resolvedMetadata) {
  $existingMeta = Get-Content -Raw -LiteralPath $resolvedMetadata | ConvertFrom-Json
  if ($null -ne $existingMeta.sfx) { $existingSfx = @($existingMeta.sfx) }
}

$voices = @()
foreach ($line in $lines) {
  $frame = [int]$line.Frame
  $fileName = "{0:D2}.wav" -f $frame
  $absolutePath = Join-Path $resolvedOutput $fileName
  $rawPath = Join-Path $resolvedOutput ("{0:D2}.raw.wav" -f $frame)
  $targetDuration = [double]$line.Duration

  $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
  try {
    $synth.SelectVoice($VoiceName)
    $synth.Rate = $Rate
    $synth.Volume = 100
    $synth.SetOutputToWaveFile($rawPath)
    $synth.Speak([string]$line.Text)
  }
  finally {
    $synth.Dispose()
  }

  $durationLine = & ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $rawPath
  $spokenDuration = [math]::Round([double]::Parse($durationLine, [Globalization.CultureInfo]::InvariantCulture), 3)
  & ffmpeg -y -v error -i $rawPath -af "apad" -t $targetDuration $absolutePath
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed while padding frame $frame" }
  Remove-Item -LiteralPath $rawPath
  $duration = $targetDuration

  $tokens = [regex]::Matches([string]$line.Text, "\S+") | ForEach-Object { $_.Value }
  $weights = foreach ($token in $tokens) {
    $letters = ([regex]::Replace($token, "[^A-Za-z0-9]", "")).Length
    [math]::Max(1, $letters)
  }
  $totalWeight = ($weights | Measure-Object -Sum).Sum
  $cursor = 0.0
  $words = @()
  for ($i = 0; $i -lt $tokens.Count; $i++) {
    $share = $spokenDuration * ($weights[$i] / $totalWeight)
    $start = $cursor
    $end = [math]::Min($spokenDuration, $cursor + $share)
    $words += [ordered]@{
      id = $i
      text = $tokens[$i]
      start = [math]::Round($start, 3)
      end = [math]::Round($end, 3)
    }
    $cursor = $end
  }

  $relativePath = "assets/voice/$fileName"
  $voices += [ordered]@{
    frame = $frame
    path = $relativePath
    duration_s = $duration
    words = $words
  }
  Write-Output ("generated frame {0}: {1}s -> {2}" -f $frame, $duration, $relativePath)
}

$meta = [ordered]@{
  bgm = $null
  bgm_pending = $false
  voices = $voices
  sfx = $existingSfx
}

$json = $meta | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText($resolvedMetadata, $json, [System.Text.UTF8Encoding]::new($false))
Write-Output "wrote $resolvedMetadata"
