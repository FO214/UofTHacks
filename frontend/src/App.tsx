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
	useColorModeValue,
	VStack,
	Icon,
	Badge,
	Divider,
} from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { FiUpload, FiCamera, FiMessageCircle } from "react-icons/fi";

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

	// Theme colors
	const bgColor = useColorModeValue("gray.50", "gray.900");
	const borderColor = useColorModeValue("gray.200", "gray.700");
	const cardBg = useColorModeValue("white", "gray.800");
	const accentColor = "blue.500";

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
			<Box minH="100vh" bg={bgColor} py={8}>
				<Container maxW="container.xl">
					<VStack spacing={8} align="stretch">
						<Box textAlign="center">
							<Heading
								size="2xl"
								bgGradient="linear(to-r, blue.400, purple.500)"
								bgClip="text"
								mb={2}
							>
								PerspectShift
							</Heading>
							<Text fontSize="lg" color="gray.600">
								Explore images from different perspectives
							</Text>
						</Box>

						{!imageId ? (
							<Box
								{...getRootProps()}
								p={10}
								border="3px dashed"
								borderColor={
									isDragActive ? accentColor : borderColor
								}
								borderRadius="xl"
								cursor="pointer"
								transition="all 0.2s"
								_hover={{
									borderColor: accentColor,
									transform: "scale(1.01)",
								}}
								bg={cardBg}
								textAlign="center"
							>
								<input {...getInputProps()} />
								<Icon
									as={FiUpload}
									w={10}
									h={10}
									color={accentColor}
									mb={4}
								/>
								{isDragActive ? (
									<Text fontSize="lg" fontWeight="medium">
										Drop your image here
									</Text>
								) : (
									<VStack spacing={2}>
										<Text fontSize="lg" fontWeight="medium">
											Drag and drop an image here
										</Text>
										<Text fontSize="sm" color="gray.500">
											or click to select one
										</Text>
									</VStack>
								)}
							</Box>
						) : (
							<Grid
								templateColumns={{ base: "1fr", lg: "2fr 1fr" }}
								gap={8}
								bg={cardBg}
								p={6}
								borderRadius="xl"
								shadow="sm"
							>
								<Box>
									<Box
										borderRadius="lg"
										overflow="hidden"
										bg="gray.100"
										position="relative"
									>
										{currentImage && (
											<Image
												src={currentImage}
												alt="Transformed image"
												maxH="600px"
												w="100%"
												objectFit="contain"
											/>
										)}
										<Badge
											position="absolute"
											top={4}
											right={4}
											colorScheme="blue"
											fontSize="sm"
											px={3}
											py={1}
											borderRadius="full"
											display="flex"
											alignItems="center"
											gap={2}
										>
											<Icon as={FiCamera} />
											{perspective
												.split("_")
												.map(
													(word) =>
														word
															.charAt(0)
															.toUpperCase() +
														word.slice(1)
												)
												.join(" ")}{" "}
											View
										</Badge>
									</Box>
									<Box mt={4}>
										<select
											value={perspective}
											onChange={handlePerspectiveChange}
											style={{
												width: "100%",
												padding: "10px",
												borderRadius: "8px",
												border: "1px solid #E2E8F0",
												backgroundColor: "white",
												fontSize: "16px",
											}}
										>
											<option value="original">
												Original View
											</option>
											<option value="birds_eye">
												Bird's Eye View
											</option>
											<option value="worms_eye">
												Worm's Eye View
											</option>
										</select>
									</Box>
								</Box>

								<VStack align="stretch" spacing={4}>
									<Flex align="center" gap={2}>
										<Icon
											as={FiMessageCircle}
											color={accentColor}
										/>
										<Heading size="md">
											Perspectives & Comments
										</Heading>
									</Flex>
									<Box
										maxH="400px"
										overflowY="auto"
										borderRadius="lg"
										bg={useColorModeValue(
											"gray.50",
											"gray.700"
										)}
										p={4}
										sx={{
											"&::-webkit-scrollbar": {
												width: "4px",
											},
											"&::-webkit-scrollbar-track": {
												width: "6px",
											},
											"&::-webkit-scrollbar-thumb": {
												background: useColorModeValue(
													"gray.300",
													"gray.600"
												),
												borderRadius: "24px",
											},
										}}
									>
										<VStack spacing={3} align="stretch">
											{comments.map((comment) => (
												<Box
													key={comment.id}
													p={4}
													bg={cardBg}
													borderRadius="md"
													shadow="sm"
													borderLeft="4px solid"
													borderLeftColor={
														accentColor
													}
												>
													<Text
														fontSize="sm"
														color="gray.500"
														mb={1}
													>
														From{" "}
														{comment.perspective
															.split("_")
															.map(
																(word) =>
																	word
																		.charAt(
																			0
																		)
																		.toUpperCase() +
																	word.slice(
																		1
																	)
															)
															.join(" ")}{" "}
														View:
													</Text>
													<Text>{comment.text}</Text>
												</Box>
											))}
										</VStack>
									</Box>
									<Divider />
									<Flex gap={2}>
										<Input
											value={newComment}
											onChange={(e) =>
												setNewComment(e.target.value)
											}
											placeholder="Share your perspective..."
											size="lg"
											borderRadius="lg"
										/>
										<Button
											onClick={addComment}
											colorScheme="blue"
											size="lg"
											borderRadius="lg"
											px={8}
										>
											Add
										</Button>
									</Flex>
								</VStack>
							</Grid>
						)}
					</VStack>
				</Container>
			</Box>
		</ChakraProvider>
	);
}

export default App;
