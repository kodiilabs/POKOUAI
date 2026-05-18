import { Sprout, Camera, Volume2, ChevronRight } from 'lucide-react-native';

describe('lucide-react-native', () => {
  it('exports Sprout icon as a component', () => {
    expect(Sprout).toBeDefined();
    expect(typeof Sprout).toBe('function');
  });

  it('exports the icons every screen will need', () => {
    expect(Camera).toBeDefined();
    expect(Volume2).toBeDefined();
    expect(ChevronRight).toBeDefined();
  });
});
