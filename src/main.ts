const randWeight = () => Math.random() * 2 - 1;
const randomMatrix = (n: number, m: number): number[][] => Array.from({ length: n }, () => Array.from({ length: m }, randWeight));
const dot = (a: number[], b: number[]) => a.reduce((cc, v, i) => cc + v * b[i], 0);
const transpose = (a: number[][]) => a[0].map((_, i) => a.map(v => v[i]));
const matmul = (a: number[][], b: number[][]): number[][] => {
  const bt = transpose(b);
  return a.map(r => bt.map(c => dot(r, c)));
}
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
class NN {
  weights: number[][][] = [];
  activation: (x: number) => number;
  constructor(private shape: number[], ws?: number[][][], activation = sigmoid) {
    this.activation = activation;
    if(ws) {
      this.weights = ws;
    } else {
      this.weights = Array.from({ length: shape.length - 1 }, (_, i) => randomMatrix(shape[i], shape[i + 1]));
    }
  }
  forward = (inputs: number[]) => this.weights.reduce((a, w) => matmul(a, w).map(r => r.map(this.activation)), [inputs])[0]
  mutate = (rate: number) => new NN(this.shape, this.weights.map(l => l.map(w => w.map(x => Math.random() < rate ? (x + randWeight()) / 2 : x))))
}
type CollisionBox = { x: number, y: number, width: number, height: number }
type Pos = { xPos: number, yPos: number }
type Obstacle = Pos & { width: number, height: number, collisionBoxes: CollisionBox[] }
type RunnerInstance = {
  horizon: { obstacles: Obstacle[] }
  tRex: Pos & {
    startJump: (velocity: number) => void,
    status: "RUNNING" | "CRASHED" | "WAITING",
    jumping: boolean
    setDuck: (duck: boolean) => void
  }
  restart: () => void
  start: () => void
  distanceRan: number
  currentSpeed: number
}
class Player {
  instance: RunnerInstance
  nn: NN
  best: {
    nn: NN,
    distanceRan: number
  }
  mr = 0.1;
  constructor(instance: RunnerInstance) {
    this.instance = instance;
    this.nn = new NN([7, 7, 1]);
    this.best = {
      nn: this.nn,
      distanceRan: 0
    }
  }
  step() {
    if(this.instance.tRex.status === "CRASHED") {
      if(this.instance.distanceRan >= this.best.distanceRan) {
        this.nn = this.nn.mutate(this.mr);
        console.log("Mutating");
        this.best = {
          nn: this.nn,
          distanceRan: this.instance.distanceRan
        };
      } else {
        this.nn = this.best.nn.mutate(this.mr);
      }
      this.instance.restart();
    } else if(this.instance.tRex.status === "RUNNING") {
      if(this.instance.horizon.obstacles.length > 0) {
        const inputs = [
          this.instance.currentSpeed,
          this.instance.tRex.yPos,
          this.instance.horizon.obstacles[0].xPos,
          this.instance.horizon.obstacles[0].yPos,
          this.instance.horizon.obstacles[0].xPos + this.instance.horizon.obstacles[0].collisionBoxes[0].width,
          this.instance.horizon.obstacles[0].yPos + this.instance.horizon.obstacles[0].collisionBoxes[0].height,
        ];
        const [thought] = this.nn.forward(inputs);
        console.log(thought)
        if(thought > 0.5 && !this.instance.tRex.jumping) {
          console.log("JUMP");
          this.instance.tRex.startJump(1);
        }
      }
    }
  }
  play() {
    this.step();
    requestAnimationFrame(this.play.bind(this))
  }
}


const player = new Player((window as any).Runner.instance_);
player.play();