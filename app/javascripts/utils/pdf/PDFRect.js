//  The origin is left-bottom corner.
export default class PDFRect {
  constructor(x, y, width, height) {
    this.left = this.x = x;
    this.bottom = this.y = y;
    this.width = width;
    this.height = height;
    this.right = x + width;
    this.top = y + height;
  }

  doesIntersect(rect) {
    return (
      Math.max(this.left, rect.left) < Math.min(this.right, rect.right) &&
      Math.max(this.bottom, rect.bottom) < Math.min(this.top, rect.top)
    );
  }

  union(rect) {
    let left = Math.min(this.left, rect.left);
    let bottom = Math.min(this.bottom, rect.bottom);
    let right = Math.max(this.right, rect.right);
    let top = Math.max(this.top, rect.top);
    return new PDFRect(left, bottom, right - left, top - bottom);
  }
}
