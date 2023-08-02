export class ATClient {
  private version = 'unknown';

  constructor(verion: string) {
    this.version = verion;
    this.getID = this.getID.bind(this);
    this.getVersion = this.getVersion.bind(this);
    this.getName = this.getName.bind(this);
    this.setModel = this.setModel.bind(this);
    this.getModel = this.getModel.bind(this);
    this.getModelList = this.getModelList.bind(this);
    this.getAlgorithm = this.getAlgorithm.bind(this);
    this.setAlgorithm = this.setAlgorithm.bind(this);
    this.getAlgorithmList = this.getAlgorithmList.bind(this);
    this.getConfidence = this.getConfidence.bind(this);
    this.setConfidence = this.setConfidence.bind(this);
    this.getIOU = this.getIOU.bind(this);
    this.setIOU = this.setIOU.bind(this);
    this.reset = this.reset.bind(this);
    this.saveConfig = this.saveConfig.bind(this);
    this.clearConfig = this.clearConfig.bind(this);
    this.invoke = this.invoke.bind(this);
  }

  public async getID(): Promise<string> {
    return 'unknown';
  }

  public async getVersion(): Promise<string> {
    return 'unknown';
  }

  public async getName(): Promise<string> {
    return 'unknown';
  }

  public async getError(): Promise<string> {
    return 'unknown';
  }

  public async setModel(model: string): Promise<boolean> {
    return false;
  }

  public async getModel(): Promise<string> {
    return '';
  }

  public async getModelList(): Promise<any[]> {
    return [];
  }

  public async getAlgorithm(): Promise<string> {
    return '';
  }

  public async setAlgorithm(algorithm: string): Promise<boolean> {
    return false;
  }

  public async getAlgorithmList(): Promise<any[]> {
    return [];
  }

  public async getConfidence(): Promise<number> {
    return 0;
  }

  public async setConfidence(confidence: number): Promise<boolean> {
    return false;
  }

  public async getIOU(): Promise<number> {
    return 0;
  }

  public async setIOU(iou: number): Promise<boolean> {
    return false;
  }

  public async reset(): Promise<boolean> {
    return false;
  }

  public async saveConfig(): Promise<boolean> {
    return false;
  }

  public async clearConfig(): Promise<boolean> {
    return false;
  }

  public async invoke(times: number): Promise<boolean> {
    return false;
  }

  public async getRotate(): Promise<number> {
    return 0;
  }

  public async getInvoke(): Promise<number> {
    return 0;
  }
}

export default ATClient;
