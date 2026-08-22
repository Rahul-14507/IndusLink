import React, { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './CardSwap.css';

gsap.registerPlugin(ScrollTrigger);

export const Card = React.forwardRef(({ customClass, ...rest }, ref) => (
  <div ref={ref} {...rest} className={`card-swap-item ${customClass ?? ''} ${rest.className ?? ''}`.trim()} />
));
Card.displayName = 'Card';

const makeSlot = (i, distX, distY, total) => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i
});

const placeNow = (el, slot, skew) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true
  });

const CardSwap = ({
  width = 560,
  height = 320,
  cardDistance = 16,
  verticalDistance = 16,
  triggerId = 'differentiators',
  children
}) => {
  const childArr = useMemo(() => React.Children.toArray(children), [children]);
  const refs = useMemo(
    () => childArr.map(() => React.createRef()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childArr.length]
  );

  const containerRef = useRef(null);

  useEffect(() => {
    const total = refs.length;
    // 1. Initial stack placement
    refs.forEach((r, i) => {
      if (r.current) {
        placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total), 0.5);
      }
    });

    const container = containerRef.current;
    const triggerElement = document.getElementById(triggerId);
    if (!container || !triggerElement) return undefined;

    // 2. Create ScrollTrigger-controlled timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerElement,
        start: 'top top',
        end: '+=3600',
        pin: true,
        scrub: 1.0,
        invalidateOnRefresh: true
      }
    });

    // Stagger slide out animations for each card except the last
    for (let i = 0; i < total - 1; i++) {
      const el = refs[i].current;
      if (el) {
        const direction = i % 2 === 0 ? -1 : 1; // alternate slide left and right
        tl.to(
          el,
          {
            x: `${direction * 140}%`,
            y: `-=${60 + i * 20}`,
            rotate: direction * 12,
            opacity: 0,
            duration: 1,
            ease: 'power1.inOut'
          },
          i * 0.95
        );
      }
    }

    // Gentle zoom-in focus on the final remaining card
    const lastEl = refs[total - 1].current;
    if (lastEl) {
      tl.to(
        lastEl,
        {
          scale: 1.04,
          duration: 0.5,
          ease: 'power1.out'
        },
        (total - 1) * 0.95
      );
    }

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [cardDistance, verticalDistance, triggerId, refs.length, refs]);

  const rendered = childArr.map((child, i) =>
    React.isValidElement(child)
      ? React.cloneElement(child, {
          key: i,
          ref: refs[i],
          style: { width, height, ...(child.props.style ?? {}) }
        })
      : child
  );

  return (
    <div ref={containerRef} className="card-swap-container" style={{ width, height }}>
      {rendered}
    </div>
  );
};

export default CardSwap;
