CC = emcc

NAME = bliplay
SRC = src
DIR = assets
MODULE_NAME = Bliplay
TARGET_MAIN = $(DIR)/wasm/$(NAME).js
TARGETS_ALL = $(TARGET_MAIN) $(TARGET_MAIN:%.js=%.wasm)

BKSRC = bliplay/BlipKit/src
BPSRC = bliplay/parser
BUSRC = bliplay/utility

SOURCES = $(SRC)/$(NAME).c
SOURCES += $(wildcard $(BKSRC)/*.c)
SOURCES += $(wildcard $(BPSRC)/*.c)
SOURCES += $(wildcard $(BUSRC)/*.c)

EXPORTS = ["_main"]
RUNTIME_EXPORTS = ["ccall","cwrap","UTF8ArrayToString"]

CFLAGS = -O2 -Wall -I./$(BKSRC) -I./$(BPSRC) -I./$(BUSRC) -DBK_USE_64_BIT=0

# Debug
#CFLAGS = -O0 -g -Wall -I./$(BKSRC) -I./$(BPSRC) -I./$(BUSRC) -DBK_USE_64_BIT=0

OTHER_FLAGS = \
	-s WASM=1 \
	-s NO_EXIT_RUNTIME=1 \
	-s EXPORTED_FUNCTIONS='$(EXPORTS)' \
	-s EXPORTED_RUNTIME_METHODS='$(RUNTIME_EXPORTS)' \
	-s EXPORT_NAME="'$(MODULE_NAME)'"

# Debug
#	-s ASSERTIONS=2 \
#	-s ALIASING_FUNCTION_POINTERS=0 \
#	-s SAFE_HEAP=1 \
#	-s DETERMINISTIC=1

# Optional
#	-s TOTAL_MEMORY=100663296 \
#	-s ALLOW_MEMORY_GROWTH=1

ALL_FLAGS = $(CFLAGS) $(OTHER_FLAGS)

.PHONY: clean

all: $(TARGETS_ALL)

$(TARGETS_ALL): $(SOURCES)
	$(CC) $(ALL_FLAGS) -o $(TARGET_MAIN) $(SOURCES)

clean:
	rm -f $(TARGETS_ALL)
