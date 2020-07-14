// type postDataOptions = {
// 	responseType?: string
// }
// const defaultOptions: postDataOptions = {
// 	responseType: 'json'
// }
const postData = async (url: string, data: object) => {
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	})
	return response
}
postData.text = async (url: string, data: object) => {
	return (await postData(url, data)).text()
}
postData.json = async (url: string, data: object) => {
	return (await postData(url, data)).json()
}
export default postData