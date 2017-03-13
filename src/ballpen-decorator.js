class BallpenDecorator  {
	static analyzeDecoratorDependency(str) {
		const _t = str.split('->:');
		return {
			decorators: _t.slice(1),
			raw: _t[0]
		}
	}
}

export default BallpenDecorator;
