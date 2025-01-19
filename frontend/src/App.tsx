import { useState, useCallback } from "react";
import {
	ChakraProvider,
	Box,
	Heading,
	Text,
	Image,
	Button,
	Input,
	Container,
	Flex,
	Grid,
} from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

const API_URL = "http://localhost:8000";

interface Comment {
	id: string;
	image_id: string;
	text: string;
	perspective: string;
}

function App() {
	const [imageId, setImageId] = useState<string | null>(null);
	const [currentImage, setCurrentImage] = useState<string | null>(null);
	const [perspective, setPerspective] = useState("original");
	const [comments, setComments] = useState<Comment[]>([]);
	const [newComment, setNewComment] = useState("");

	const onDrop = useCallback(async (acceptedFiles: File[]) => {
		const file = acceptedFiles[0];
		if (!file) return;

		const formData = new FormData();
		formData.append("file", file);

		try {
			const response = await axios.post(`${API_URL}/upload/`, formData);
			setImageId(response.data.image_id);
			loadImage(response.data.image_id, "original");
			console.log("Image uploaded successfully");
		} catch (error) {
			console.error("Failed to upload image:", error);
		}
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"image/*": [".png", ".jpg", ".jpeg"],
		},
		multiple: false,
	});

	const loadImage = async (id: string, perspective: string) => {
		try {
			const response = await axios.get(
				`${API_URL}/image/${id}/${perspective}`
			);
			setCurrentImage(`data:image/png;base64,${response.data.image}`);
			setPerspective(perspective);
			loadComments(id);
		} catch (error) {
			console.error("Failed to load image:", error);
		}
	};

	const loadComments = async (id: string) => {
		try {
			const response = await axios.get(`${API_URL}/comments/${id}`);
			setComments(response.data);
		} catch (error) {
			console.error("Failed to load comments:", error);
		}
	};

	const addComment = async () => {
		if (!imageId || !newComment) return;

		try {
			await axios.post(`${API_URL}/comment/${imageId}`, {
				id: crypto.randomUUID(),
				image_id: imageId,
				text: newComment,
				perspective: perspective,
			});
			setNewComment("");
			loadComments(imageId);
			console.log("Comment added successfully");
		} catch (error) {
			console.error("Failed to add comment:", error);
		}
	};

	const handlePerspectiveChange = (
		e: React.ChangeEvent<HTMLSelectElement>
	) => {
		if (imageId) {
			loadImage(imageId, e.target.value);
		}
	};

	return (
		<ChakraProvider>
			<Container maxW="container.xl" py={8}>
				<Box mb={8}>
					<Heading mb={4}>PerspectShift</Heading>
					<Text>
						Upload an image and explore different perspectives
					</Text>
				</Box>

				{!imageId ? (
					<Box
						{...getRootProps()}
						p={10}
						border="2px dashed"
						borderColor={isDragActive ? "blue.500" : "gray.200"}
						borderRadius="md"
						cursor="pointer"
						_hover={{ borderColor: "blue.500" }}
						w="100%"
						textAlign="center"
					>
						<input {...getInputProps()} />
						{isDragActive ? (
							<Text>Drop the image here</Text>
						) : (
							<Text>
								Drag and drop an image here, or click to select
								one
							</Text>
						)}
					</Box>
				) : (
					<Grid templateColumns="1fr 300px" gap={8} w="100%">
						<Box>
							{currentImage && (
								<Image
									src={currentImage}
									alt="Transformed image"
									maxH="600px"
									objectFit="contain"
									borderRadius="md"
									mb={4}
								/>
							)}
							<select
								value={perspective}
								onChange={handlePerspectiveChange}
								style={{
									width: "100%",
									padding: "8px",
									borderRadius: "6px",
									border: "1px solid #E2E8F0",
								}}
							>
								<option value="original">Original View</option>
								<option value="birds_eye">
									Bird's Eye View
								</option>
								<option value="worms_eye">
									Worm's Eye View
								</option>
							</select>
						</Box>

						<Box>
							<Heading size="md" mb={4}>
								Perspectives & Comments
							</Heading>
							<Box
								maxH="400px"
								overflowY="auto"
								p={4}
								borderRadius="md"
								bg="gray.50"
								mb={4}
							>
								<Box>
									{comments.map((comment) => (
										<Box
											key={comment.id}
											p={2}
											bg="white"
											borderRadius="md"
											mb={2}
										>
											<Text
												fontSize="sm"
												color="gray.500"
											>
												From {comment.perspective}{" "}
												perspective:
											</Text>
											<Text>{comment.text}</Text>
										</Box>
									))}
								</Box>
							</Box>
							<Flex>
								<Input
									value={newComment}
									onChange={(e) =>
										setNewComment(e.target.value)
									}
									placeholder="Share your perspective..."
									mr={2}
								/>
								<Button onClick={addComment} colorScheme="blue">
									Add
								</Button>
							</Flex>
						</Box>
					</Grid>
				)}
			</Container>
		</ChakraProvider>
	);
}

export default App;
