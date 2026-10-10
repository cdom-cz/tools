/**
 * Word list for English passphrases — common, easy-to-remember nouns
 * (3–8 letters, a–z). Its size is deliberately similar to the Czech list.
 * `estimateEntropyBits` computes per-word entropy from the real list length
 * (log2(WORDS_EN.length)). The list is deduplicated on load.
 */
const RAW_WORDS = `
anchor angel apple apron arrow artist attic autumn bacon badge bakery balcony bamboo banana banjo barn basket beach beacon beard bear
bed beetle bell belt bench berry bicycle bird biscuit blanket blossom boat bone book boot bottle bowl box branch bread brick bridge
broom brush bubble bucket butter button cabin cactus cake camel camera candle candy canoe canyon captain carpet carrot castle cat
cave cedar cellar chair chalk cheese cherry chess chicken chimney cinema circle clock cloud clover coast coffee coin comet compass
cookie copper coral cotton cousin cow crab cradle crayon creek cricket crown crystal cup curtain daisy dance desert desk diamond
dinner dock doctor dog dolphin donkey door dragon dream drum duck eagle earth echo egg engine falcon farm feather fence ferry field
finger fire fish flag flame flower flute fog forest fork fountain fox frog garden garlic ghost giant ginger glass glove goat gold
goose grape grass guitar hammer harbor hat hawk hazel heart hedge helmet hill honey horse hotel house igloo island ivory jacket
jar jelly jewel jungle kettle key kitchen kite kitten knife ladder lake lamp lantern leaf lemon lettuce library lily lion
lizard lobster locket magnet maple marble market meadow melon mirror monkey moon moss motor mountain mouse mushroom napkin needle
nest noodle ocean olive onion orange otter oven owl paddle palace panda paper parrot peach pearl pebble pencil penguin pepper piano
picnic pillow pilot pine pirate pizza planet plate pocket pond pony potato puppy puzzle rabbit radio rainbow raven river robot
rocket roof rope rose saddle sailor salad salmon sand school scarf seal shadow sheep shell shield ship shoe shovel silver sketch
sky snail snow sock spider spoon square squirrel stable star station stone storm straw stream sugar summer sunset swan sweater
table tea teapot tent tiger toast tomato tower train tree tulip tunnel turkey turtle umbrella valley velvet village violin walnut
wagon wall water wave whale wheat wheel willow window winter wizard wolf wool yacht zebra zipper acorn album almond alley amber
ankle anvil arch atlas avenue axe badger ballet bandit barrel basil bay beam beaver bishop blade blizzard bonfire bouquet bowtie
bracket breeze buffalo cabbage cannon canvas carbon cargo cheetah cliff cobweb comb cottage cucumber dagger dawn deer dessert
dune dust eclipse emerald fabric feast fiddle fig flask fossil frost galaxy gate gem glacier glider grove gull hammock harp
hornet hurdle iceberg inkwell jaguar jester jigsaw kayak koala lagoon lawn lemur lilac llama lodge lotus magpie mango mask mint
mole moose mule nectar nutmeg oak oasis orchid oyster pasta peanut pear pigeon plum poet pudding pumpkin quail quilt radish
raisin reef ribbon ring rooster saffron sage satchel scooter sparrow spice sponge stew swing thistle thunder tulip walrus waffle
basin bean blimp bolt cheek cider cobra cork dime drawer dwarf elbow ember fern flint gravel hobby inch jam knot ledge lilac mitten nickel oar pail plank quartz razor shelf spark tile trumpet vase wallet yard
`;

/** Normalization: lowercase a-z only, 3–8 characters, no duplicates. */
export const WORDS_EN: readonly string[] = Array.from(
  new Set(
    RAW_WORDS.split(/\s+/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => /^[a-z]{3,8}$/.test(w)),
  ),
);
