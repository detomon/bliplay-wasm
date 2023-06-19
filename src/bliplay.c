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
static BKInt lineNumbers[255];
static BKInt activeLineNumbers[255];
static BKInt lineNumbersCount = 0;
static BKUInt durationTicks = 0;

static BKTKParser parser;
static BKTKCompiler compiler;
static BKTKContext context;
static BKTKTokenizer tokenizer;

static BKInt isRunning = 0;
static BKInt isInitialized = 0;
static BKInt wasCompiled = 0;

static BKHashTableIterator sampleItor;

static void deinterlaceInt16Float(int16_t const source[], float target[], size_t length, size_t size) {
	for (size_t n = 0; n < size; n++) {
		float* targetPtr = &target[n * length];

		for (size_t i = n; i < length * size; i += size) {
			*targetPtr++ = (float) source[i] / INT16_MAX;
		}
	}
}

static BKInt putToken(BKTKToken const* token, BKTKParser* parser) {
	BKInt res;

	if ((res = BKTKParserPutTokens(parser, token, 1)) != 0) {
		return res;
	}

	return 0;
}

static void emitDone(void) {
	EM_ASM(Bliplay.emitEvent('done'));
}

static void emitLineNumber(BKInt trackIdx, BKInt lineno) {
	EM_ASM({Bliplay.emitEvent('lineNumber', $0, $1)}, trackIdx, lineno);
}

static BKInt hasRunningTracks(BKTKContext const* ctx) {
	BKTKTrack const* track;
	BKSize numActive = 0;

	for (BKInt i = 0; i < ctx->tracks.len; i ++) {
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

static void updateLineNumbers(BKTKContext const* ctx) {
	BKTKTrack const* track;

	for (BKInt i = 0; i < ctx->tracks.len; i ++) {
		track = *(BKTKTrack const* const*) BKArrayItemAt(&ctx->tracks, i);

		if (track) {
			if (track->lineno != activeLineNumbers[i]) {
				activeLineNumbers[i] = track->lineno;
				lineNumbers[lineNumbersCount++] = track->lineno;
				emitLineNumber(i, track->lineno);
			}
		}
	}
}

EMSCRIPTEN_KEEPALIVE
BKInt initialize(BKInt theNumChannels, BKInt theSampleRate) {
	BKInt res;

	numChannels = theNumChannels;
	sampleRate = theSampleRate;

	if (isInitialized) {
		fprintf(stderr, "Already initialized\n");
		return -1;
	}

	if ((res = BKContextInit(&ctx, numChannels, sampleRate)) != 0) {
		fprintf(stderr, "BKContextInit failed (%s)\n", BKStatusGetName(res));
	}

	if (res == 0) {
		buffer = calloc(sizeof(BKFrame[numChannels]), maxBufferSize);
		bufferFloat = calloc(sizeof(float[numChannels]), maxBufferSize);

		if (!buffer || !bufferFloat) {
			fprintf(stderr, "Allocation error\n");
			res = -1;
		}
	}

	if (res == 0) {
		isInitialized = 1;
	}

	return res;
}

EMSCRIPTEN_KEEPALIVE
int stopAudioContext(void) {
	BKTKContextDetach(&context);
	isRunning = 0;

	return 0;
}

EMSCRIPTEN_KEEPALIVE
int writeFile(char const* path, void const* data, size_t size) {
	FILE* file = fopen(path, "wb+");

	if (!file) {
		return -1;
	}

	fwrite(data, sizeof(char), size, file);
	fclose(file);

	return 0;
}

EMSCRIPTEN_KEEPALIVE
char const* nextSamplePath(void) {
	char const* key;
	BKTKSample* sample;

	// return next sample name
	while (BKHashTableIteratorNext (&sampleItor, &key, (void **) &sample)) {
		if (sample->path.len) {
			return (char const*) sample->path.str;
		}
	}

	return NULL;
}

EMSCRIPTEN_KEEPALIVE
BKInt compileSource(char const* source) {
	BKInt res = 0;
	BKTKParserNode* nodeTree;
	size_t const length = strlen(source);

	wasCompiled = 0;

	if (!isInitialized) {
		fprintf(stderr, "initialize was not called\n");
		return -1;
	}

	memset(lineNumbers, 0, sizeof(lineNumbers));
	memset(activeLineNumbers, 0, sizeof(activeLineNumbers));
	memset(buffer, 0, sizeof(*buffer) * maxBufferSize * numChannels);
	memset(bufferFloat, 0, sizeof(*bufferFloat) * maxBufferSize * numChannels);
	lineNumbersCount = 0;

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

	if ((res = BKTKContextInit(&context, 0)) != 0) {
		fprintf(stderr, "BKTKContextInit failed (%s)\n", BKStatusGetName(res));
	}

	if (res == 0) {
		res = BKTKTokenizerPutChars (&tokenizer, (uint8_t const*) source, length, (BKTKPutTokenFunc) putToken, &parser);

		// end tokenizer
		BKTKTokenizerPutChars (&tokenizer, NULL, 0, (BKTKPutTokenFunc) putToken, &parser);

		if (BKTKParserHasError(&parser)) {
			fprintf(stderr, "%s\n", parser.buffer);
			res = -1;
		}
		else if (BKTKTokenizerHasError(&tokenizer)) {
			fprintf(stderr, "%s\n", tokenizer.buffer);
			res = -1;
		}

		if (res == 0) {
			nodeTree = BKTKParserGetNodeTree(&parser);

			if ((res = BKTKCompilerCompile(&compiler, nodeTree)) != 0) {
				fprintf(stderr, "%s", (char const*)compiler.error.str);
				res = -1;
			}

			if (res == 0) {
				BKHashTableIteratorInit(&sampleItor, &compiler.samples);
			}
		}
	}

	if (res == 0) {
		wasCompiled = 1;
	}

	return res;
}

EMSCRIPTEN_KEEPALIVE
BKInt createContext(void) {
	BKInt res = 0;

	if (!wasCompiled) {
		fprintf(stderr, "compileSource\n");
		return -1;
	}

	if ((res = BKTKContextCreate(&context, &compiler)) != 0) {
		fprintf(stderr, "Creating context failed (%s)\n", BKStatusGetName(res));
		fprintf(stderr, "%s\n", (char const*)context.error.str);
	}

	BKDispose(&parser);
	BKDispose(&tokenizer);
	BKDispose(&compiler);
	memset(&sampleItor, 0, sizeof(sampleItor));

	return 0;
}

BKUInt calculateDuration() {
	BKUInt ticks = 0;

	for (BKInt i = 0; i < context.tracks.len; i++) {
		BKInt running = 1;
		BKInt trackTicks = 0;
		BKTKTrack *track = *(BKTKTrack**) BKArrayItemAt(&context.tracks, i);
		BKTKInterpreter *interpreter = (BKTKInterpreter *) &track->interpreter;

		do {
			BKInt stepTicks;

			BKTKInterpreterAdvance(interpreter, track, &stepTicks);

			if (running) {
				trackTicks += stepTicks;
			}

			running = !(interpreter->object.flags & (BKTKInterpreterFlagHasStopped | BKTKInterpreterFlagHasRepeated));
		}
		while (running);

		ticks = BKMax(ticks, trackTicks);
	}

	BKTKContextReset(&context);
	BKContextReset(&ctx);

	return ticks;
}

EMSCRIPTEN_KEEPALIVE
int startAudioContext(void) {
	BKInt res = 0;

	if (!isInitialized) {
		fprintf(stderr, "initialize was not called\n");
		return -1;
	}

	if (!wasCompiled) {
		fprintf(stderr, "no compiled context\n");
		return -1;
	}

	if ((res = BKTKContextAttach(&context, &ctx)) != 0) {
		fprintf(stderr, "Attaching context failed (%s)\n", BKStatusGetName(res));
	}

	durationTicks = 0;

	if (res == 0) {
		isRunning = 1;
		durationTicks = calculateDuration();
	}

	return res;
}

EMSCRIPTEN_KEEPALIVE
BKInt generate(int length) {
	BKInt size = BKContextGenerate(&ctx, buffer, length);

	// fill remaining buffer if context was terminated
	if (size < length) {
		memset(&buffer[size * numChannels], 0, sizeof(*buffer) * (length - size) * numChannels);
	}

	deinterlaceInt16Float(buffer, bufferFloat, length, numChannels);

	if (isRunning) {
		updateLineNumbers(&context);

		if (!hasRunningTracks(&context)) {
			isRunning = 0;
			emitDone();
		}
	}

	return size;
}

EMSCRIPTEN_KEEPALIVE
float const* getBuffer() {
	return bufferFloat;
}

EMSCRIPTEN_KEEPALIVE
BKUInt getTime(void) {
	return BKTimeGetTime(ctx.currentTime);
}

EMSCRIPTEN_KEEPALIVE
BKUInt getDuration() {
	return (
		(float)durationTicks
		* (float)context.info.tickRate.factor
		/ (float)context.info.tickRate.divisor
		* sampleRate);
}

EMSCRIPTEN_KEEPALIVE
int main(int argc, char const* const argv[]) {
	EM_ASM(Bliplay.emitEvent('ready'));

	emscripten_exit_with_live_runtime();

	return 0;
}
