import {it,expect} from 'vitest';
import {artworkDetails} from '../src/lib/artwork-details';
import {artworkComparisons} from '../src/lib/artwork-comparisons';
it('has a bounded undistorted 4:3 view window and prompt for every comparison work',()=>{
 for(const study of artworkComparisons)for(const id of study.workIds){
  const detail=artworkDetails[id];expect(detail).toBeDefined();expect(detail.prompt.length).toBeGreaterThan(10);
  const c=detail.crop;expect(c.x).toBeGreaterThanOrEqual(0);expect(c.y).toBeGreaterThanOrEqual(0);
  expect(c.x+c.width).toBeLessThanOrEqual(c.sourceWidth);expect(c.y+c.height).toBeLessThanOrEqual(c.sourceHeight);
  expect(c.width/c.height).toBeCloseTo(4/3);expect(c.width).toBeLessThan(c.sourceWidth);
 }
});
it('preserves the right image boundary in the Degas gaze comparison',()=>{
 const c=artworkDetails['436121'].crop;expect(c.x+c.width).toBe(c.sourceWidth);
});
