export class VecfImpl {
	protected components : Float64Array;
	protected dim: number;
	constructor(dim: number) {
		this.dim = dim;
		this.components = new Float64Array(dim);
	}
}

export class Vector2f extends VecfImpl {

	constructor(x?: number, y?: number) {
		super(2);
		if(x !== undefined && y !== undefined)
		{
			this.components[0] = x;
			this.components[1] = y;
		}
		
	}

	public get x(){
		return this.components[0];
	}
	public get y(){
		return this.components[1];
	}

	public add(other: Vector2f) : Vector2f
	{
		
		return new Vector2f(this.x + other.x,this.y + other.y);
	}
}