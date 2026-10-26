#!/usr/bin/env python3
"""Junta voz/cena01.mp3 … cena10.mp3 ao vídeo, cada uma no início da sua cena,
abaixando a trilha enquanto a voz fala (ducking). Precisa do ffmpeg.

Uso: python3 juntar-voz.py            -> video-com-voz.mp4
Avisa se alguma fala passar do tempo da cena (aí, acelere a voz ou encurte o texto).
"""
import json
import pathlib
import subprocess

AQUI = pathlib.Path(__file__).resolve().parent


def duracao(arquivo):
    saida = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(arquivo)],
        capture_output=True, text=True, check=True,
    )
    return float(saida.stdout.strip())


def main():
    cenas = json.loads((AQUI / "narracao.json").read_text(encoding="utf-8"))
    entradas = ["-i", str(AQUI / "video-sem-voz.mp4"), "-i", str(AQUI / "trilha.m4a")]
    filtros, rotulos = [], []
    for i, c in enumerate(cenas):
        arq = AQUI / "voz" / f"cena{c['cena']:02d}.mp3"
        if not arq.exists():
            raise SystemExit(f"Falta {arq} (rode gerar-voz.py ou grave a voz)")
        d = duracao(arq)
        folga = c["fim"] - c["inicio"]
        if d > folga:
            print(f"ATENÇÃO cena {c['cena']}: a fala tem {d:.1f}s e a cena tem {folga:.1f}s")
        entradas += ["-i", str(arq)]
        ms = int(c["inicio"] * 1000)
        filtros.append(f"[{i + 2}:a]aresample=44100,adelay={ms}|{ms},volume=1.6[v{i}]")
        rotulos.append(f"[v{i}]")
    filtros.append(f"{''.join(rotulos)}amix=inputs={len(rotulos)}:normalize=0[voz]")
    filtros.append("[voz]asplit=2[voz1][voz2]")
    filtros.append("[1:a][voz1]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[trilha]")
    filtros.append("[trilha][voz2]amix=inputs=2:normalize=0,alimiter=limit=0.95[audio]")
    saida = AQUI / "video-com-voz.mp4"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", *entradas, "-filter_complex", ";".join(filtros),
         "-map", "0:v", "-map", "[audio]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
         "-movflags", "+faststart", str(saida)],
        check=True,
    )
    print("pronto:", saida)


if __name__ == "__main__":
    main()
