import React from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { useLocation } from 'react-router-dom';

interface ProductTourProps {
  run: boolean;
  stepIndex: number;
  onComplete: () => void;
  onStop: () => void;
  setStepIndex: (index: number) => void;
}

const ProductTour: React.FC<ProductTourProps> = ({
  run,
  stepIndex,
  onComplete,
  onStop,
  setStepIndex,
}) => {
  const location = useLocation();

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-bold mb-2">Welcome to TripConnect! 👋</h2>
          <p className="mb-2">Let's take a quick tour to learn about Tags and Smart Lists - a powerful way to organize your contacts.</p>
          <p className="text-sm text-gray-600">This tour will take about 1 minute.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: 'a[data-tour="tags-nav"]',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Tags Page 🏷️</h3>
          <p>First, let's go to the Tags page. Tags are categories you create to organize your contacts.</p>
          <p className="text-sm text-gray-600 mt-2">Examples: Language, Skill, Status, Relationship</p>
        </div>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: 'button[data-tour="create-tag"]',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Create a Tag</h3>
          <p>Click here to create your first tag. You can give it a name (like "Language") and an optional value (like "Spanish").</p>
          <p className="text-sm text-blue-600 mt-2 font-medium">💡 When you create a tag, a Smart List is automatically created!</p>
        </div>
      ),
      placement: 'left',
      disableBeacon: true,
    },
    {
      target: 'a[data-tour="contacts-nav"]',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Contacts Page 👥</h3>
          <p>After creating tags, go to Contacts to assign them to people in your network.</p>
        </div>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: 'a[data-tour="lists-nav"]',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Smart Lists 📋</h3>
          <p className="mb-2">Here's where the magic happens! Smart Lists are automatically created from your tags.</p>
          <p className="mb-2">When you tag a contact, they're automatically added to the corresponding list.</p>
          <p className="text-sm text-blue-600 font-medium">Lists update automatically - no manual work needed!</p>
        </div>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-bold mb-2">You're All Set! 🎉</h2>
          <p className="mb-2">Now you know how Tags and Smart Lists work together:</p>
          <ol className="list-decimal ml-4 space-y-1 text-sm mb-3">
            <li>Create tags to categorize contacts</li>
            <li>Assign tags to contacts</li>
            <li>Smart Lists update automatically</li>
          </ol>
          <p className="text-sm text-gray-600">You can restart this tour anytime from the help menu.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, action, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    console.log('Joyride callback:', { status, index, action, type, stepIndex });

    if (finishedStatuses.includes(status)) {
      onComplete();
    } else if (action === 'close') {
      onStop();
    } else if (type === EVENTS.STEP_AFTER) {
      // Handle step navigation
      if (action === ACTIONS.NEXT) {
        setStepIndex(index + 1);
      } else if (action === ACTIONS.PREV) {
        setStepIndex(index - 1);
      }
    }
  };

  // Only show tour on certain pages
  const allowedPaths = ['/', '/tags', '/contacts', '/lists', '/groups', '/dashboard'];
  const shouldShowTour = allowedPaths.includes(location.pathname);

  return (
    <Joyride
      steps={steps}
      run={run && shouldShowTour}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      disableScrolling={false}
      spotlightPadding={10}
      styles={{
        options: {
          primaryColor: '#3B82F6',
          textColor: '#1F2937',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          padding: 20,
        },
        buttonNext: {
          backgroundColor: '#3B82F6',
          borderRadius: 6,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#6B7280',
          marginRight: 10,
        },
        buttonSkip: {
          color: '#9CA3AF',
        },
      }}
      locale={{
        back: 'Previous',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};

export default ProductTour;
