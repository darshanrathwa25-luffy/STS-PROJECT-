import React from 'react';
import { useGeometryStore } from '../../store/geometryStore';
import { FindingsTable } from './FindingsTable';
import { Credits } from './Credits';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mt-12">
    <h2 className="font-serif text-[26px] leading-tight text-ink">{title}</h2>
    <div className="mt-3 space-y-4 text-[17px] leading-relaxed text-ink-soft">{children}</div>
  </section>
);

/** Chapter V: what was found, why it mattered, and what we know about our own space. */
export const ReflectionPage: React.FC = () => {
  const { reflectionText, setReflectionText } = useGeometryStore();

  return (
    <div className="absolute inset-0 overflow-y-auto bg-paper">
      <article className="max-w-[44rem] mx-auto px-5 sm:px-8 py-12 select-text">
        <p className="text-[13px] text-ink-muted">Chapter V</p>
        <h1 className="mt-2 font-serif text-[44px] sm:text-[52px] leading-[1.05] tracking-tight text-ink">
          So what shape is space?
        </h1>

        <Section title="What you found">
          <p>
            Chapters I to III asked the same three questions on three surfaces, and every time the flat plane sat
            exactly between the sphere and the saddle. Each cell below fills in once you have seen it for yourself.
          </p>
          <div className="pt-2">
            <FindingsTable />
          </div>
        </Section>

        <Section title="One question, three answers">
          <p>
            Euclid's fifth postulate says that through a point off a line there is exactly one parallel. For about two
            thousand years mathematicians tried to prove it from his other, simpler axioms, and failed.
          </p>
          <p>
            In the 1820s Lobachevsky and Bolyai stopped trying. They assumed the opposite, that there are many
            parallels, and found a geometry with no contradictions in it: the one you walked across in Chapter IV.
            Riemann later described geometries with no parallels at all, like the sphere's. Euclid's geometry became
            one possibility among several.
          </p>
        </Section>

        <Section title="Why it mattered">
          <p>
            If more than one geometry is logically possible, logic alone can't tell you which one the world follows.
            The shape of space stopped being something you could know by thinking and became something you had to
            measure.
          </p>
          <p>
            Einstein's general theory of relativity (1915) used Riemann's geometry to describe gravity as the
            curvature of spacetime. Light bending around the Sun, the orbit of Mercury and the clocks in GPS
            satellites all have to be worked out in curved geometry.
          </p>
        </Section>

        <Section title="And our universe?">
          <p>
            Cosmologists test the geometry of the universe on the largest scale they can see, using the pattern of
            light left over from the early universe (the cosmic microwave background). So far the measurements say
            that, on average, space is very close to flat. Close, not proven exactly, and still being measured.
          </p>
          <p>
            Small regions can still curve. Near a star or a black hole, triangles made of light rays do not add up to
            180°.
          </p>
        </Section>

        <Section title="Your notes">
          <label htmlFor="reflection-notes" className="block text-[15px]">
            Which result surprised you most? If you lived on a huge sphere or a saddle, how could you find out
            without leaving it?
          </label>
          <textarea
            id="reflection-notes"
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="I'd draw a really big triangle and measure its angles…"
            className="w-full h-40 bg-paper-raised border border-rule p-3 text-[15px] leading-relaxed text-ink placeholder:text-ink-faint focus:outline-none focus:border-ink resize-y"
          />
          <p className="text-[13px] text-ink-muted">These notes are the same ones as in the Notes drawer.</p>
        </Section>

        <footer className="mt-16 pt-6 border-t border-rule">
          <Credits />
        </footer>
      </article>
    </div>
  );
};
