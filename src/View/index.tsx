export interface IRenderNode {
  value: number;
  name: string;
  children: IRenderNode[];
}

interface Point {
  x: number;
  y: number;
}

class TreeVisualizer {
  private ctx: CanvasRenderingContext2D;
  private nodeWidth = 100;
  private nodeHeight = 50;
  private levelHeight = 100;
  private positions = new Map<IRenderNode, Point>();

  private config = {
    nodeFill: '#ffffff',
    nodeStroke: 'green',
    lineColor: 'blue',
    textColor: 'red',
    fontSize: 14,
    cornerRadius: 5,
    lineWidth: 1,
    arrowSize: 8, // 箭头大小
  };

  constructor(
    private canvas: HTMLCanvasElement,
    private padding = 50
  ) {
    this.ctx = canvas.getContext('2d')!;
  }

  /**
   * 计算树的总宽度
   */
  private getTreeWidth(node: IRenderNode): number {
    if (!node.children || node.children.length === 0) {
      return this.nodeWidth;
    }

    const childrenWidth = node.children
      .map(child => this.getTreeWidth(child))
      .reduce((a, b) => a + b, 0);

    return Math.max(this.nodeWidth, childrenWidth);
  }

  /**
   * 计算节点位置
   */
  private calculatePositions(
    node: IRenderNode,
    x: number,
    y: number,
    availableWidth: number
  ) {
    // 设置当前节点位置
    this.positions.set(node, { x, y });

    if (node.children && node.children.length > 0) {
      const totalChildrenWidth = this.getTreeWidth(node);
      let startX = x - totalChildrenWidth / 2 + this.nodeWidth / 2;

      // 为每个子节点计算位置
      node.children.forEach(child => {
        const childWidth = this.getTreeWidth(child);
        const childX = startX + childWidth / 2 - this.nodeWidth / 2;
        this.calculatePositions(
          child,
          childX,
          y + this.levelHeight,
          childWidth
        );
        startX += childWidth;
      });
    }
  }

  /**
   * 绘制箭头
   */
  private drawArrow(fromX: number, fromY: number, toX: number, toY: number) {
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // 调整箭头终点,使其不要碰到节点
    const arrowLength = this.config.arrowSize;
    const shortenBy = this.nodeHeight / 2;
    const endX = toX - Math.cos(angle) * shortenBy;
    const endY = toY - Math.sin(angle) * shortenBy;

    // 画直线
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    // 画箭头
    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - arrowLength * Math.cos(angle - Math.PI / 6),
      endY - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - arrowLength * Math.cos(angle + Math.PI / 6),
      endY - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
  }

  /**
   * 绘制连接线和箭头
   */
  private drawConnections(node: IRenderNode) {
    const pos = this.positions.get(node)!;

    for (const child of node.children) {
      const childPos = this.positions.get(child)!;

      this.ctx.strokeStyle = this.config.lineColor;
      this.ctx.lineWidth = this.config.lineWidth;

      // 绘制带箭头的连接线
      this.drawArrow(
        pos.x + this.nodeWidth / 2,
        pos.y + this.nodeHeight,
        childPos.x + this.nodeWidth / 2,
        childPos.y
      );

      this.drawConnections(child);
    }
  }

  /**
   * 绘制整棵树
   */
  public drawTree(root: IRenderNode) {
    // 计算树的总宽度和高度
    const treeWidth = this.getTreeWidth(root);
    const treeHeight = this.calculateTreeHeight(root) * this.levelHeight;

    // 设置canvas尺寸，加上padding
    this.canvas.width = treeWidth + this.padding * 2;
    this.canvas.height = treeHeight + this.padding * 2;

    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 计算起始位置,使树居中
    const startX = (this.canvas.width - treeWidth) / 2 + treeWidth / 2;
    const startY = this.padding;

    // 计算所有节点位置
    this.positions.clear();
    this.calculatePositions(root, startX, startY, treeWidth);

    // 先画连接线
    this.drawConnections(root);

    // 再画节点
    this.drawAllNodes(root);
  }

  /**
   * 计算树的高度（层数）
   */
  private calculateTreeHeight(node: IRenderNode): number {
    if (!node.children || node.children.length === 0) {
      return 1;
    }
    return 1 + Math.max(...node.children.map(child => this.calculateTreeHeight(child)));
  }

  /**
   * 绘制圆角矩形
   */
  private drawRoundedRect(x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;

    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.arcTo(x + w, y, x + w, y + h, r);
    this.ctx.arcTo(x + w, y + h, x, y + h, r);
    this.ctx.arcTo(x, y + h, x, y, r);
    this.ctx.arcTo(x, y, x + w, y, r);
    this.ctx.closePath();

    // 填充和描边
    this.ctx.fillStyle = this.config.nodeFill;
    this.ctx.strokeStyle = this.config.nodeStroke;
    this.ctx.fill();
    this.ctx.stroke();
  }

  /**
   * 绘制所有节点
   */
  private drawAllNodes(node: IRenderNode) {
    const pos = this.positions.get(node)!;

    // 绘制节点
    this.drawRoundedRect(
      pos.x,
      pos.y,
      this.nodeWidth,
      this.nodeHeight,
      this.config.cornerRadius
    );

    // 绘制文本
    this.drawNodeText(
      node.name,
      pos.x + this.nodeWidth / 2,
      pos.y + this.nodeHeight / 2
    );

    // 递归绘制子节点
    for (const child of node.children) {
      this.drawAllNodes(child);
    }
  }

  /**
  * 绘制节点文本
  */
  private drawNodeText(text: string, x: number, y: number) {
    this.ctx.fillStyle = this.config.textColor;
    this.ctx.font = `${this.config.fontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x, y);
  }
}

export function renderTree(canvas, tree: IRenderNode) {
  const visualizer = new TreeVisualizer(canvas);
  visualizer.drawTree(tree);
}