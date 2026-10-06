"use client";

// Телефон из фотографий (вырезаны из картинок владелицы):
//  • звонит — розовый дисковый телефон дребезжит, по бокам «дзынь»-дуги, вокруг мерцают фетровые звёзды;
//  • ответили — телефон уезжает вниз, сверху на витом проводе опускается трубка и качается,
//    из динамика расходятся звуковые круги; тап по трубке — она уезжает обратно вверх.
import { AnimatePresence, motion } from "framer-motion";
import { assetUrl } from "@/content/assets";

const PHONE = assetUrl("phone-rotary");
const HANDSET = assetUrl("phone-handset");
const STAR = assetUrl("felt-star");

export function PhotoPhone({ state, onTap }: { state: "idle" | "ringing" | "talking"; onTap?: () => void }) {
  return (
    <div className="relative w-full">
      {/* фетровые звёздочки */}
      {[
        { left: "-4%", top: "-8%", w: 54, d: 0 },
        { right: "-2%", top: "6%", w: 40, d: 0.6 },
        { right: "8%", bottom: "-6%", w: 32, d: 1.2 },
      ].map(({ w, d, ...pos }, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <motion.img
          key={i}
          src={STAR}
          alt=""
          className="pointer-events-none absolute z-0 drop-shadow-[0_3px_3px_rgba(150,40,90,.25)]"
          style={{ ...pos, width: w }}
          animate={{ rotate: [0, 20, 0], scale: state === "ringing" ? [1, 1.2, 1] : [1, 1.06, 1] }}
          transition={{ duration: state === "ringing" ? 0.9 : 3, delay: d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* корпус */}
      <motion.button
        type="button"
        aria-label="phone"
        onClick={state === "ringing" ? onTap : undefined}
        className="relative z-10 block w-full"
        animate={
          state === "talking"
            ? { y: 70, x: -30, scale: 0.78, opacity: 0.3, rotate: -4 }
            : state === "ringing"
              ? { y: 0, scale: 1, opacity: 1, rotate: [0, -3.5, 3.5, -3.5, 3.5, -2, 0] }
              : { y: 0, scale: 1, opacity: 1, rotate: 0 }
        }
        transition={
          state === "ringing"
            ? { rotate: { duration: 0.5, repeat: Infinity, repeatDelay: 0.9 }, default: { type: "spring", damping: 14 } }
            : { type: "spring", damping: 16 }
        }
        style={{ transformOrigin: "50% 85%" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PHONE} alt="" draggable={false} className="w-full drop-shadow-[0_18px_20px_rgba(122,59,82,.3)]" />
      </motion.button>

      {/* «дзынь»-дуги */}
      {state === "ringing" && (
        <svg viewBox="0 0 300 120" className="pointer-events-none absolute inset-x-0 top-[2%] z-20 w-full overflow-visible">
          {[-1, 1].map((side) => (
            <motion.g
              key={side}
              animate={{ opacity: [0, 1, 0], x: [0, side * 6, side * 10] }}
              transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 0.5 }}
            >
              <path d={side < 0 ? "M18 30 Q6 50 18 70" : "M282 30 Q294 50 282 70"} fill="none" stroke="#e27a9b" strokeWidth={4} strokeLinecap="round" />
              <path d={side < 0 ? "M4 20 Q-12 50 4 80" : "M296 20 Q312 50 296 80"} fill="none" stroke="#e27a9b" strokeWidth={4} strokeLinecap="round" opacity={0.55} />
            </motion.g>
          ))}
        </svg>
      )}

      {/* трубка на проводе опускается сверху */}
      <AnimatePresence>
        {state === "talking" && (
          <motion.button
            type="button"
            aria-label="handset"
            onClick={onTap}
            className="fixed left-[70%] top-0 z-30 h-[66dvh] -translate-x-1/2"
            initial={{ y: "-105%" }}
            animate={{ y: 0 }}
            exit={{ y: "-110%", transition: { duration: 0.45, ease: "easeIn" } }}
            transition={{ type: "spring", damping: 11, stiffness: 70 }}
          >
            <motion.div
              className="relative h-full"
              style={{ transformOrigin: "50% 0%" }}
              animate={{ rotate: [5, -5, 5] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={HANDSET} alt="" draggable={false} className="h-full w-auto drop-shadow-[0_14px_16px_rgba(122,59,82,.3)]" />
              {/* звуковые круги у динамика */}
              <span className="pointer-events-none absolute bottom-[12%] left-[18%]">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="absolute -left-6 -top-6 size-12 rounded-full border-[3px] border-pink-deep"
                    initial={{ scale: 0.4, opacity: 0.9 }}
                    animate={{ scale: 2.4, opacity: 0 }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5 }}
                  />
                ))}
              </span>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
