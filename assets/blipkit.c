#include <emscripten.h>
#include <string.h>
#include <unistd.h>
#include "BKTK.h"
#include "BlipKit.h"

static BKInt numChannels = 2;
static BKInt sampleRate = 44100;
static BKInt maxBufferSize = 4096;
static BKFrame* buffer;
static float* bufferFloat;
static BKContext ctx;

static BKTKParser parser;
static BKTKCompiler compiler;
static BKTKContext context;
static BKTKTokenizer tokenizer;

static BKInt isRunning = 0;

EMSCRIPTEN_KEEPALIVE
float const* getBuffer() {
	return bufferFloat;
}

static void deinterlaceInt16Float(int16_t const source[], float target[], size_t length, size_t size) {
	for (size_t n = 0; n < size; n++) {
		float* targetPtr = &target[n * length];

		for (size_t i = n; i < length * size; i += size) {
			*targetPtr++ = (float) source[i] / INT16_MAX;
		}
	}
}

EMSCRIPTEN_KEEPALIVE
BKInt generate(int length) {
	BKInt result = BKContextGenerate(&ctx, buffer, length);

	if (result > 0) {
		deinterlaceInt16Float(buffer, bufferFloat, length, numChannels);
	}

	return result;
}

EMSCRIPTEN_KEEPALIVE
BKTime getTime(void) {
	return ctx.currentTime;
}

static void initialize(BKInt numChannels, BKInt sampleRate) {
	BKContextInit(&ctx, numChannels, sampleRate);

	buffer = calloc(sizeof(BKFrame[numChannels]), maxBufferSize);
	bufferFloat = calloc(sizeof(float[numChannels]), maxBufferSize);
}

static BKInt putToken(BKTKToken const* token, BKTKParser* parser) {
	BKInt res;

	if ((res = BKTKParserPutTokens(parser, token, 1)) != 0) {
		return res;
	}

	return 0;
}

EMSCRIPTEN_KEEPALIVE
int compileSource(char const* source) {
	BKInt res = 0;
	BKTKParserNode* nodeTree;
	size_t const length = strlen(source);

	BKDispose(&context);

	if ((res = BKTKParserInit(&parser)) != 0) {
		fprintf(stderr, "BKTKParserInit failed (%s)\n", BKStatusGetName(res));
	}

	if ((res = BKTKTokenizerInit(&tokenizer)) != 0) {
		fprintf(stderr, "BKTKTokenizerInit failed (%s)\n", BKStatusGetName(res));
	}

	if ((res = BKTKCompilerInit(&compiler)) != 0) {
		fprintf(stderr, "BKTKCompilerInit failed (%s)\n", BKStatusGetName(res));
	}

	if (res == 0) {
		res = BKTKTokenizerPutChars (&tokenizer, source, length, (BKTKPutTokenFunc) putToken, &parser);

		// end tokenizer
		BKTKTokenizerPutChars (&tokenizer, NULL, 0, (BKTKPutTokenFunc) putToken, &parser);

		if (BKTKTokenizerHasError(&tokenizer)) {
			fprintf(stderr, "%s\n", tokenizer.buffer);
			res = -1;
		}
		else if (BKTKParserHasError(&parser)) {
			fprintf(stderr, "%s\n", parser.buffer);
			res = -1;
		}

		if (res == 0) {
			nodeTree = BKTKParserGetNodeTree(&parser);

			if ((res = BKTKCompilerCompile(&compiler, nodeTree)) != 0) {
				fprintf(stderr, "%s", (char const*)compiler.error.str);
				res = -1;
			}

			if (res == 0) {
				if ((res = BKTKContextInit(&context, 0)) != 0) {
					fprintf(stderr, "BKTKCompilerInit failed (%s)\n", BKStatusGetName(res));
				}

				if ((res = BKTKContextCreate(&context, &compiler)) != 0) {
					fprintf(stderr, "Creating context failed (%s)\n", BKStatusGetName(res));
					fprintf(stderr, "%s\n", (char const*)context.error.str);
				}
			}
		}
	}

	BKDispose(&tokenizer);
	BKDispose(&parser);
	BKDispose(&compiler);

	return res;
}

EMSCRIPTEN_KEEPALIVE
int startContext(void) {
	BKInt res = 0;

	if ((res = BKTKContextAttach(&context, &ctx)) != 0) {
		fprintf(stderr, "Attaching context failed (%s)\n", BKStatusGetName(res));
	}

	if (res == 0) {
		isRunning = 1;
	}

	return res;
}

static void emitDone(void) {
	EM_ASM(BlipKit.emitEvent('done'));
}

EMSCRIPTEN_KEEPALIVE
int stopContext(void) {
	BKTKContextDetach(&context);
	BKDispose(&context);
	isRunning = 0;
}

static BKInt hasRunningTracks(BKTKContext const* ctx) {
	BKTKTrack const* track;
	BKSize numActive = 0;

	for (BKInt i = 0; i < ctx -> tracks.len; i ++) {
		track = *(BKTKTrack const* const*) BKArrayItemAt(&ctx->tracks, i);

		if (track) {
			numActive++;

			// exit if tracks have stopped
			if (track->interpreter.object.flags & BKTKInterpreterFlagHasStopped) {
				numActive--;
			}
		}
	}

	return numActive > 0;
}

static void loop(void) {
	if (isRunning && !hasRunningTracks(&context)) {
		isRunning = 0;
		emitDone();
	}
}

EMSCRIPTEN_KEEPALIVE
int main(int argc, char const* const argv[]) {
	initialize(numChannels, sampleRate);

	EM_ASM(BlipKit.emitEvent('ready'));

	emscripten_set_main_loop(loop, 0, 0);

	return 0;
}
