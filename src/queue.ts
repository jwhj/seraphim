class QueueNode<T>{
	val: T
	nxt: QueueNode<T>
}
export default class Queue<T>{
	head: QueueNode<T>
	tail: QueueNode<T>
	push(val: T) {
		const node = new QueueNode<T>()
		node.val = val
		if (!this.head) {
			this.head = this.tail = node
		} else {
			this.tail.nxt = node
			this.tail = node
		}
	}
	pop(): T {
		if (!this.head) {
			throw 'Queue underflow'
		} else {
			const res = this.head.val
			this.head = this.head.nxt
			return res
		}
	}
}