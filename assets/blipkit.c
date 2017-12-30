#include <emscripten.h>
#include <string.h>
#include <unistd.h>
//#include <SDL/SDL.h>
#include "BlipKit.h"

static BKInt numChannels = 2;
static BKInt sampleRate = 44100;
static BKInt maxBufferSize = 4096;
static BKFrame* buffer;
static float* bufferFloat;
static BKContext ctx;
static BKTrack track;
static BKInstrument instr;
static BKData wave;

EMSCRIPTEN_KEEPALIVE
BKInt setWaveform(BKEnum waveform) {
	return BKSetAttr(&track, BK_WAVEFORM, waveform);
}

EMSCRIPTEN_KEEPALIVE
BKInt setNote(float note) {
	if (note >= 0) {
		note *= BK_FINT20_UNIT;
	}

	return BKSetAttr(&track, BK_NOTE, note);
}

EMSCRIPTEN_KEEPALIVE
BKInt setEnvelope(BKInt attack, BKInt decay, BKInt sustain, BKInt release) {
	return BKInstrumentSetEnvelopeADSR(&instr, attack, decay, sustain * BK_MAX_VOLUME / 255, release);
}

EMSCRIPTEN_KEEPALIVE
float const* getBuffer() {
	return bufferFloat;
}

EMSCRIPTEN_KEEPALIVE
void setMajorArpeggio() {
	static BKInt const arpeggio[4] = {
		3,
		0.0 * BK_FINT20_UNIT, 4.0 * BK_FINT20_UNIT, 7.0 * BK_FINT20_UNIT,
	};

	BKSetPtr(&track, BK_ARPEGGIO, arpeggio, sizeof(arpeggio));
}

EMSCRIPTEN_KEEPALIVE
void setMinorArpeggio() {
	static BKInt const arpeggio[4] = {
		3,
		0.0 * BK_FINT20_UNIT, 3.0 * BK_FINT20_UNIT, 7.0 * BK_FINT20_UNIT,
	};

	BKSetPtr(&track, BK_ARPEGGIO, arpeggio, sizeof(arpeggio));
}

EMSCRIPTEN_KEEPALIVE
void setVibrato(float depth) {
	BKInt vibrato[2] = {8, BK_FINT20_UNIT * depth};
	BKSetPtr(&track, BK_EFFECT_VIBRATO, vibrato, sizeof(vibrato));
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
	BKTrackInit(&track, BK_SQUARE);
	BKInstrumentInit(&instr);
	BKDataInit(&wave);

	BKInt const pitch[4] = {
		12.0 * BK_FINT20_UNIT, 12.0 * BK_FINT20_UNIT, 0, -12.0 * BK_FINT20_UNIT
	};

	BKInt const dutyCycle[4] = {
		0, 8
	};

	//BKInstrumentSetSequence(&instr, BK_SEQUENCE_PITCH, pitch, 4, 2, 1);
	//BKInstrumentSetSequence(&instr, BK_SEQUENCE_DUTY_CYCLE, dutyCycle, 2, 0, 1);
	BKInstrumentSetEnvelopeADSR(&instr, 3, 8, BK_MAX_VOLUME * 0.8, 84);

	BKTrackAttach(&track, &ctx);

	BKSetAttr(&track, BK_MASTER_VOLUME, BK_MAX_VOLUME * 0.15);
	BKSetAttr(&track, BK_VOLUME, BK_MAX_VOLUME);
	BKSetAttr(&track, BK_DUTY_CYCLE, 8);
	BKSetPtr(&track, BK_INSTRUMENT, &instr, sizeof(&instr));
	//BKSetAttr(&track, BK_ARPEGGIO_DIVIDER, 8);
	BKSetAttr(&track, BK_EFFECT_PORTAMENTO, 12);
	BKSetAttr(&track, BK_TRIANGLE_IGNORES_VOLUME, 0);
	//BKSetAttr(&track, BK_PANNING, -8000);

	// fixes Error: Out of bounds memory access???
	//printf("main: %p %p\n", BKSetAttr, BKTrackAlloc);

	buffer = calloc(sizeof(BKFrame[numChannels]), maxBufferSize);
	bufferFloat = calloc(sizeof(float[numChannels]), maxBufferSize);
}

static void loop(void) {
	//printf("w\n");
}

/*static BKInt fill_audio (void* ctx, Uint8* stream, int len) {
	int const sampleRate = 44100;
	int const numChannels = 2;
	BKUInt const numFrames = len / sizeof(BKFrame) / numChannels;

	printf("%u\n", numFrames);

	return BKContextGenerate (&ctx, (BKFrame*)stream, numFrames);
}

static BKInt initSDL(void* ctx, char const** error) {
	int const sampleRate = 44100;
	int const numChannels = 2;
	int const samples = 512;

	SDL_Init (SDL_INIT_AUDIO);

	SDL_AudioSpec wanted;

	wanted.freq     = sampleRate;
	wanted.format   = AUDIO_S16SYS;
	wanted.channels = numChannels;
	wanted.samples  = samples;
	wanted.callback = (void*)fill_audio;
	wanted.userdata = NULL;

	if (SDL_OpenAudio(&wanted, NULL) < 0) {
		*error = SDL_GetError();
		return -1;
	}

	return 0;
}*/

EMSCRIPTEN_KEEPALIVE
int main(int argc, char const* const argv[]) {
	//char const* error = NULL;

	initialize(numChannels, sampleRate);

	//initSDL(NULL, &error);

	//printf("Error: %s\n", error);

	//SDL_PauseAudio(0);

	//EM_ASM(app.ready());

	emscripten_set_main_loop(loop, 0, 0);

	// end
	//SDL_CloseAudio();

	return 0;
}