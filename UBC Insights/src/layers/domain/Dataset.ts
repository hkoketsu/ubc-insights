export default abstract class Dataset {
    public abstract isIdentical(otherDataset: Dataset): boolean;
}
