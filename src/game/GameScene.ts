import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Arc;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private collectibles?: Phaser.GameObjects.Group;
  private enemies?: Phaser.GameObjects.Group;
  private score = 0;

  constructor() {
    super("GameScene");
  }

  create() {
    // 배경
    this.cameras.main.setBackgroundColor("#0a0a0a");

    // 그리드 배경
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x1a1a1a, 1);
    for (let x = 0; x < this.scale.width; x += 50) {
      graphics.lineBetween(x, 0, x, this.scale.height);
    }
    for (let y = 0; y < this.scale.height; y += 50) {
      graphics.lineBetween(0, y, this.scale.width, y);
    }

    // 플레이어 (흰 원)
    this.player = this.add.circle(this.scale.width / 2, this.scale.height / 2, 12, 0xffffff);
    this.physics.add.existing(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

    // 입력
    this.cursors = this.input.keyboard?.createCursorKeys();

    // 아이템 그룹
    this.collectibles = this.physics.add.group();

    // 적 그룹
    this.enemies = this.physics.add.group();

    // 아이템 스폰 타이머
    this.time.addEvent({
      delay: 500,
      callback: this.spawnCollectible,
      callbackScope: this,
      loop: true,
    });

    // 적 스폰 타이머
    this.time.addEvent({
      delay: 2000,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    });

    // 충돌 감지
    this.physics.add.overlap(this.player, this.collectibles, this.collectItem as any, undefined, this);
  }

  update() {
    if (!this.player || !this.cursors) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const speed = 250;

    // WASD + 화살표 이동
    body.setVelocity(0);

    if (this.cursors.left.isDown || this.input.keyboard?.addKey("A").isDown) {
      body.setVelocityX(-speed);
    } else if (this.cursors.right.isDown || this.input.keyboard?.addKey("D").isDown) {
      body.setVelocityX(speed);
    }

    if (this.cursors.up.isDown || this.input.keyboard?.addKey("W").isDown) {
      body.setVelocityY(-speed);
    } else if (this.cursors.down.isDown || this.input.keyboard?.addKey("S").isDown) {
      body.setVelocityY(speed);
    }

    // 적 플레이어 추적
    this.enemies?.children.entries.forEach(enemy => {
      const e = enemy as Phaser.GameObjects.Arc;
      const body = e.body as Phaser.Physics.Arcade.Body;

      const angle = Phaser.Math.Angle.Between(e.x, e.y, this.player!.x, this.player!.y);

      body.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);
    });
  }

  private spawnCollectible() {
    const colors = [0xff4400, 0x0088ff, 0x00ffff, 0xccffcc]; // 화염, 물, 얼음, 바람
    const x = Phaser.Math.Between(50, this.scale.width - 50);
    const y = Phaser.Math.Between(50, this.scale.height - 50);

    const item = this.add.circle(x, y, 8, Phaser.Utils.Array.GetRandom(colors));
    this.physics.add.existing(item);
    this.collectibles?.add(item);
  }

  private spawnEnemy() {
    // 화면 가장자리에서 스폰
    const side = Phaser.Math.Between(0, 3);
    let x, y;

    switch (side) {
      case 0:
        x = 0;
        y = Phaser.Math.Between(0, this.scale.height);
        break;
      case 1:
        x = this.scale.width;
        y = Phaser.Math.Between(0, this.scale.height);
        break;
      case 2:
        x = Phaser.Math.Between(0, this.scale.width);
        y = 0;
        break;
      default:
        x = Phaser.Math.Between(0, this.scale.width);
        y = this.scale.height;
    }

    const enemy = this.add.circle(x, y, 15, 0xff0000);
    this.physics.add.existing(enemy);
    this.enemies?.add(enemy);
  }

  private collectItem(_player: any, item: any) {
    item.destroy();
    this.score += 10;

    // React에 점수 전달
    this.game.events.emit("scoreUpdate", this.score);
  }

  public getScore() {
    return this.score;
  }
}
