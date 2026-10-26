#!/usr/bin/env python3
"""Gera um arquivo de voz por cena a partir de narracao.json.

Motores aceitos (escolha com --motor):
  edge     voz neural da Microsoft, grátis (pip install edge-tts). Precisa de acesso a speech.platform.bing.com.
  openai   API da OpenAI (pip install openai; variável OPENAI_API_KEY).
  arquivos você já gravou: coloque voz/cena01.mp3 … voz/cena10.mp3 e pule esta etapa.

Saída: voz/cena01.mp3 … voz/cena10.mp3
"""
import argparse
import asyncio
import json
import os
import pathlib

AQUI = pathlib.Path(__file__).resolve().parent


async def edge(cenas, voz, velocidade):
    import edge_tts

    for c in cenas:
        destino = AQUI / "voz" / f"cena{c['cena']:02d}.mp3"
        await edge_tts.Communicate(c["texto"], voz, rate=velocidade).save(str(destino))
        print("ok", destino.name)


def openai_tts(cenas, voz):
    from openai import OpenAI

    cliente = OpenAI()
    for c in cenas:
        destino = AQUI / "voz" / f"cena{c['cena']:02d}.mp3"
        with cliente.audio.speech.with_streaming_response.create(
            model="gpt-4o-mini-tts", voice=voz, input=c["texto"],
            instructions="Fale em português do Brasil, tom de anúncio, animado e confiante.",
        ) as resposta:
            resposta.stream_to_file(destino)
        print("ok", destino.name)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--motor", choices=["edge", "openai"], default="edge")
    ap.add_argument("--voz", default=None, help="edge: pt-BR-AntonioNeural (masc.) ou pt-BR-FranciscaNeural (fem.); openai: alloy, nova, onyx…")
    ap.add_argument("--velocidade", default="+5%", help="só edge: ex. +0%, +10%")
    a = ap.parse_args()
    cenas = json.loads((AQUI / "narracao.json").read_text(encoding="utf-8"))
    (AQUI / "voz").mkdir(exist_ok=True)
    if a.motor == "edge":
        asyncio.run(edge(cenas, a.voz or "pt-BR-AntonioNeural", a.velocidade))
    else:
        if not os.environ.get("OPENAI_API_KEY"):
            raise SystemExit("Defina OPENAI_API_KEY")
        openai_tts(cenas, a.voz or "onyx")


if __name__ == "__main__":
    main()
