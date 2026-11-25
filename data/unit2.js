/* ============================================================
   COOL CODING GAME — UNIT II CONTENT: "Convolutional Neural Networks" (12h)
   Course: 26 UBAI 601 · Region: CONVOLUTION VALLEY (north-west) — 5 locations
   Code snippets kept rare (only u2l1 includes a compact Conv+Pool snippet).
   ============================================================ */

window.COURSE_CONTENT = window.COURSE_CONTENT || {};

/* ---- u2l1 · Conv & Pooling Layers (Rare Code Milestone 2/5) ---- */
COURSE_CONTENT['u2l1'] = {
  title: 'Convolution & Pooling Layers',
  topic: 'Spatial locality, downsampling, and classification heads',
  python: [
    '# Practical 3: core CNN building block',
    'block = nn.Sequential(',
    '    nn.Conv2d(3, 32, kernel_size=3, padding=1),',
    '    nn.ReLU(),',
    '    nn.MaxPool2d(kernel_size=2, stride=2)',
    ')'
  ],
  learn: [
    'Flattening a high-res image into an MLP explodes parameter counts and throws away 2D spatial structure.',
    'Convolution layers slide small shared kernels across height and width, keeping local pixel neighborhoods intact.',
    'Pooling layers (Max or Average) downsample feature maps to cut compute and add slight shift invariance before Fully Connected layers classify.'
  ],
  quiz: [
    { q: 'Why do CNNs outperform plain MLPs on image tasks?',
      a: ['They preserve 2D spatial structure and share kernel weights across locations', 'They require no activation functions', 'They use a separate weight per pixel with no sharing', 'They flatten images before the first layer'],
      correct: 0, why: 'Weight sharing and local receptive fields drastically reduce parameters and exploit translation invariance.' },
    { q: 'What is the main job of a MaxPooling layer?',
      a: ['Downsample spatial resolution while keeping the strongest activations', 'Increase the number of RGB input channels', 'Sort pixel values alphabetically', 'Replace the softmax output layer'],
      correct: 0, why: 'MaxPool shrinks height and width (e.g. by 2x), reducing memory/compute and adding small translation tolerance.' },
    { q: 'Where do Fully Connected (Dense) layers usually sit in a classic CNN?',
      a: ['At the end, after convolutional and pooling blocks extract features', 'Before the first convolution layer', 'Inside every pooling window', 'Instead of ReLU'],
      correct: 0, why: 'Convolutional blocks extract spatial features; the flattened feature vector is then classified by FC layers.' },
    { q: 'What does padding="same" (or padding=1 for a 3x3 kernel) preserve?',
      a: ['The spatial height and width of the feature map', 'The exact RGB values of the input', 'Zero gradient flow', 'Only odd batch sizes'],
      correct: 0, why: 'Border padding prevents feature maps from shrinking on every convolution step.' },
    { q: 'If stride=2 is used in a 2D convolution, what happens to the output map size?',
      a: ['Spatial height and width shrink by roughly half', 'Spatial dimensions double', 'Channel count drops to 1', 'Weights stop updating'],
      correct: 0, why: 'Stepping the kernel 2 pixels at a time halves the spatial grid size.' }
  ]
};

/* ---- u2l2 · Filters, Kernels & Feature Maps ---- */
COURSE_CONTENT['u2l2'] = {
  title: 'Filters, Kernels & Feature Maps',
  topic: 'How learned kernels turn pixels into edge, texture, and object maps',
  learn: [
    'A kernel (filter) is a small learnable grid—like 3x3—spanning all input channels. Sliding it across an image computes dot products at each patch.',
    'Each filter outputs one 2D feature map highlighting where its specific pattern (horizontal edge, corner, fur texture) appears.',
    'Stacking 64 filters produces 64 feature maps, letting the next layer combine simple edges into complex motifs.'
  ],
  quiz: [
    { q: 'What is a "feature map" in a CNN?',
      a: ['The 2D activation grid produced by sliding one learned filter over the input', 'A list of filenames in the dataset', 'The confusion matrix after testing', 'A hand-drawn map of the GPU'],
      correct: 0, why: 'Each filter outputs a feature map indicating how strongly its pattern matched at every spatial position.' },
    { q: 'If an input image has 3 RGB channels and a Conv layer uses 16 filters of size 3x3, how many output channels are produced?',
      a: ['16 feature maps', '3 feature maps', '48 feature maps', '9 feature maps'],
      correct: 0, why: 'Each 3x3x3 filter sums across the 3 input channels to produce 1 output channel, so 16 filters yield 16 maps.' },
    { q: 'What do filters in the FIRST convolutional layer typically learn to detect?',
      a: ['Simple edges, color blobs, and oriented gradients', 'Complete dog breeds and street signs', 'Full text paragraphs', 'Learning rate schedules'],
      correct: 0, why: 'Low-level filters act like learned Gabor/edge detectors; deeper layers combine them into semantic parts.' },
    { q: 'Why does a 3x3 kernel have depth equal to the input channel count?',
      a: ['So it combines information across all incoming feature maps at once', 'Because GPUs only multiply square matrices', 'To double the image width', 'To bypass ReLU'],
      correct: 0, why: 'A filter spans K x K spatially AND C_in across depth so each output neuron blends all input channels.' },
    { q: 'What happens to the number of feature-map channels as you go deeper in typical CNNs?',
      a: ['Spatial resolution shrinks while channel depth increases', 'Spatial resolution grows while channels drop to 1', 'Both height and channels become zero', 'Channels stay fixed at 3 forever'],
      correct: 0, why: 'Pooling/strides shrink HxW while deeper layers expand channels (32 -> 64 -> 128 -> 512) to encode richer concepts.' }
  ]
};

/* ---- u2l3 · LeNet & AlexNet ---- */
COURSE_CONTENT['u2l3'] = {
  title: 'LeNet & AlexNet',
  topic: 'The pioneers that launched modern computer vision',
  learn: [
    'LeNet-5 (1998, Yann LeCun) proved CNNs could read handwritten zip-code digits using alternating conv, subsampling, and FC layers.',
    'AlexNet (2012) crushed the ImageNet challenge by scaling CNNs onto GPUs with 8 learned layers (5 conv + 3 FC).',
    'AlexNet popularized ReLU activations for faster convergence, Dropout against overfitting, and data augmentation on 1.2M images.'
  ],
  quiz: [
    { q: 'What iconic problem was LeNet-5 originally designed to solve?',
      a: ['Handwritten digit recognition (MNIST / bank checks)', 'Real-time 4K video generation', 'Machine translation across 100 languages', 'Protein folding'],
      correct: 0, why: 'LeCun’s LeNet-5 pioneered convolutional networks for recognizing handwritten digits.' },
    { q: 'Which 2012 architecture sparked the modern Deep Learning boom by winning ImageNet by a huge margin?',
      a: ['AlexNet', 'LeNet-1', 'Vanilla Perceptron', 'Word2Vec'],
      correct: 0, why: 'AlexNet cut top-5 ImageNet error dramatically, proving deep GPU-trained CNNs dominate vision.' },
    { q: 'Which activation function did AlexNet popularize to train much faster than Tanh/Sigmoid?',
      a: ['ReLU', 'Step threshold', 'Linear identity', 'Sine'],
      correct: 0, why: 'Replacing saturating Tanh units with ReLU accelerated AlexNet training several-fold.' },
    { q: 'How did AlexNet fight overfitting in its large Fully Connected layers?',
      a: ['Dropout and image data augmentation', 'Removing all biases', 'Training on only 10 images', 'Lowering input resolution to 2x2'],
      correct: 0, why: 'Dropout randomly silenced neurons during training while flips/crops artificially expanded the dataset.' },
    { q: 'What hardware shift made AlexNet practical in 2012?',
      a: ['Training in parallel on GPUs instead of CPUs alone', 'Running on analog punch cards', 'Using quantum annealers', 'Removing matrix multiplications'],
      correct: 0, why: 'AlexNet split convolution operations across two GPUs, slashing training time.' }
  ]
};

/* ---- u2l4 · VGG Architecture ---- */
COURSE_CONTENT['u2l4'] = {
  title: 'VGG Architecture',
  topic: 'Uniform 3x3 convolution stacks and deeper visual hierarchies',
  learn: [
    'VGG-16 and VGG-19 (Oxford, 2014) showed that depth matters: pushing from 8 layers to 16–19 layers boosted accuracy dramatically.',
    'Instead of large 7x7 or 11x11 filters, VGG used uniform stacks of tiny 3x3 convolutions with stride 1 and 2x2 max pooling.',
    'Two stacked 3x3 convs see the same 5x5 receptive field with fewer parameters and an extra ReLU non-linearity in between!'
  ],
  quiz: [
    { q: 'What is the signature design choice of the VGG-16 / VGG-19 family?',
      a: ['Repeating uniform 3x3 convolutional layers stacked deeply', 'Using 15x15 filters on every layer', 'Eliminating all pooling layers', 'Using recurrent LSTM gates inside images'],
      correct: 0, why: 'VGG proved a simple, regular stack of 3x3 filters scales cleanly to 16–19 layers.' },
    { q: 'Why does stacking two 3x3 conv layers beat a single 5x5 conv layer?',
      a: ['Same 5x5 receptive field with fewer parameters and two ReLU non-linearities', 'It removes all channel depth', 'It runs without backpropagation', 'It skips spatial padding'],
      correct: 0, why: 'Two 3x3 layers cost 2*(9*C^2) = 18*C^2 weights vs 25*C^2 for 5x5, while adding an extra non-linear step.' },
    { q: 'Three consecutive 3x3 convolutions have the effective receptive field of what single kernel?',
      a: ['7x7', '3x3', '12x12', '1x1'],
      correct: 0, why: 'Each added 3x3 layer expands the receptive field by 2 pixels per side: 3 -> 5 -> 7.' },
    { q: 'What is the biggest practical drawback of VGG-16?',
      a: ['Huge parameter count (~138M), mostly in the final Fully Connected layers', 'It cannot classify color images', 'It has only 2 layers', 'It refuses to work with transfer learning'],
      correct: 0, why: 'VGG’s large dense head consumes heavy memory and disk space compared to modern CNNs.' },
    { q: 'In VGG, what happens after each 2x2 MaxPool block?',
      a: ['Spatial dimensions halve while filter channel count typically doubles', 'Filter channels drop to zero', 'Images are converted to grayscale', 'Learning rate resets to 10'],
      correct: 0, why: 'VGG doubles channels (64 -> 128 -> 256 -> 512) whenever pooling halves spatial resolution.' }
  ]
};

/* ---- u2l5 · Transfer Learning ---- */
COURSE_CONTENT['u2l5'] = {
  title: 'Transfer Learning',
  topic: 'Reusing pretrained backbones via feature extraction and fine-tuning',
  learn: [
    'Training a deep CNN from scratch takes millions of images and days of GPU time. Transfer Learning lets you stand on a pretrained backbone!',
    'Early conv layers learn universal edges, curves, and textures useful for almost any visual task—from X-rays to plant leaves.',
    'Two workflows: freeze the backbone and train a new classifier head (feature extraction), or unfreeze top blocks at a tiny learning rate (fine-tuning).'
  ],
  quiz: [
    { q: 'What is Transfer Learning in Deep Learning?',
      a: ['Reusing a model trained on a large dataset as the starting point for a new task', 'Copying test labels directly into the training set', 'Transferring files via Bluetooth', 'Training a network with zero labels'],
      correct: 0, why: 'Pretrained models transfer general visual or linguistic representations to smaller downstream datasets.' },
    { q: 'Why can you freeze early layers of a CNN pretrained on ImageNet when classifying medical scans?',
      a: ['Early layers detect universal edges and textures needed across almost all images', 'Early layers contain the target class names', 'Frozen layers have infinite learning rate', 'Early layers cannot be differentiated'],
      correct: 0, why: 'Low-level visual filters generalize well across domains; only high-level task layers need specialization.' },
    { q: 'How does "fine-tuning" differ from pure feature extraction?',
      a: ['Fine-tuning unfreezes some pretrained layers and updates them with a low learning rate', 'Fine-tuning deletes the entire pretrained backbone', 'Fine-tuning uses only grid search without backprop', 'Fine-tuning never trains the output layer'],
      correct: 0, why: 'Fine-tuning adapts upper backbone representations to the new domain while using a small LR so pretrained knowledge is not destroyed.' },
    { q: 'Why use a very small learning rate when fine-tuning a pretrained backbone?',
      a: ['To adapt weights gently without destroying useful pretrained representations', 'Because large models cannot compute gradients', 'To increase overfitting intentionally', 'To turn ReLU into Sigmoid'],
      correct: 0, why: 'Large gradient updates early on can wipe out carefully learned pretrained filters.' },
    { q: 'When is Transfer Learning especially valuable?',
      a: ['When your target labeled dataset is small or compute is limited', 'Only when you have 100 billion images and unlimited TPUs', 'When inputs are completely random white noise', 'Only for 1-neuron perceptrons'],
      correct: 0, why: 'Transfer Learning delivers high accuracy quickly even with hundreds or a few thousand domain examples.' }
  ]
};
